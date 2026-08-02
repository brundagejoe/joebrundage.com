import { NextResponse } from "next/server"
import { z } from "zod"
import {
  extractProviderErrorMessage,
  getStructuredJsonCandidates,
  getTextFallbackJsonCandidate,
  OPENAI_RESPONSES_URL,
} from "@/shared/lib/ai"
import { requireAiAccess } from "@/shared/lib/auth"

const RequestSchema = z.object({
  situation: z.string().trim().min(1),
})

const BayesScenarioSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    priorLabel: z.string().trim().min(1),
    likelihoodLabel: z.string().trim().min(1),
    falsePositiveLabel: z.string().trim().min(1),
    priorPercent: z.number(),
    truePositivePercent: z.number(),
    falsePositivePercent: z.number(),
  })
  .strict()

type BayesScenarioPayload = z.infer<typeof BayesScenarioSchema>

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function normalizeBayesScenario(
  value: unknown,
  situation: string
): BayesScenarioPayload | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const fallbackTitle = "Custom"
  const fallbackDescription = `Bayes setup tailored to: ${situation}`

  const candidate = {
    title: z.string().trim().min(1).catch(fallbackTitle).parse(record.title),
    description: z
      .string()
      .trim()
      .min(1)
      .catch(fallbackDescription)
      .parse(record.description),
    priorLabel: z
      .string()
      .trim()
      .min(1)
      .catch("Chance the underlying claim is true before seeing this evidence.")
      .parse(record.priorLabel),
    likelihoodLabel: z
      .string()
      .trim()
      .min(1)
      .catch("If the claim is true, chance this evidence appears.")
      .parse(record.likelihoodLabel),
    falsePositiveLabel: z
      .string()
      .trim()
      .min(1)
      .catch("If the claim is false, chance this evidence still appears.")
      .parse(record.falsePositiveLabel),
    priorPercent: z.coerce.number().catch(10).parse(record.priorPercent),
    truePositivePercent: z.coerce
      .number()
      .catch(80)
      .parse(record.truePositivePercent),
    falsePositivePercent: z.coerce
      .number()
      .catch(15)
      .parse(record.falsePositivePercent),
  }

  const parsed = BayesScenarioSchema.safeParse(candidate)
  if (!parsed.success) {
    return null
  }

  return {
    ...parsed.data,
    priorPercent: clamp(parsed.data.priorPercent, 0, 100),
    truePositivePercent: clamp(parsed.data.truePositivePercent, 0, 100),
    falsePositivePercent: clamp(parsed.data.falsePositivePercent, 0, 100),
  }
}

function parseScenarioFromResponse(
  data: unknown,
  situation: string
): BayesScenarioPayload | null {
  const candidates = getStructuredJsonCandidates(data)
  for (const candidate of candidates) {
    const parsed = normalizeBayesScenario(candidate, situation)
    if (parsed) {
      return parsed
    }
  }

  const textCandidate = getTextFallbackJsonCandidate(data)
  if (!textCandidate) {
    return null
  }

  return normalizeBayesScenario(textCandidate, situation)
}

export async function POST(request: Request) {
  const auth = await requireAiAccess()
  if ("response" in auth) {
    return auth.response
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENAI_API_KEY environment variable." },
      { status: 500 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsedBody = RequestSchema.safeParse(body)
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "The situation field is required." },
      { status: 400 }
    )
  }

  const { situation } = parsedBody.data

  const input = `You are creating a Bayes Primer example.

Return exactly one JSON object with these keys and only these keys:
- title
- description
- priorLabel
- likelihoodLabel
- falsePositiveLabel
- priorPercent
- truePositivePercent
- falsePositivePercent

Rules:
- title: short button label, 2 to 4 words.
- description: one sentence explaining why Bayes intuition matters for this situation.
- Labels: plain language and specific to the situation.
- Percent values must be numbers between 0 and 100.
- Use realistic but educational starter values that show meaningful base-rate effects.
- Output valid JSON only with no markdown fences.

Situation:
${situation}`

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        input,
        reasoning: {
          effort: "none",
        },
        text: {
          format: {
            type: "json_schema",
            name: "bayes_custom_scenario",
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "title",
                "description",
                "priorLabel",
                "likelihoodLabel",
                "falsePositiveLabel",
                "priorPercent",
                "truePositivePercent",
                "falsePositivePercent",
              ],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                priorLabel: { type: "string" },
                likelihoodLabel: { type: "string" },
                falsePositiveLabel: { type: "string" },
                priorPercent: { type: "number", minimum: 0, maximum: 100 },
                truePositivePercent: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                falsePositivePercent: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
              },
            },
          },
        },
        max_output_tokens: 1200,
      }),
      cache: "no-store",
    })

    const data = await response.json()

    if (!response.ok) {
      const message = extractProviderErrorMessage(
        data,
        "OpenAI request failed."
      )
      return NextResponse.json({ error: message }, { status: response.status })
    }

    if (
      data &&
      typeof data === "object" &&
      (data as { status?: unknown }).status === "incomplete" &&
      (data as { incomplete_details?: { reason?: unknown } }).incomplete_details
        ?.reason === "max_output_tokens"
    ) {
      return NextResponse.json(
        {
          error:
            "Generation ran out of tokens before producing JSON output. Please retry.",
          debug: {
            usage: (data as { usage?: unknown }).usage,
            incomplete_details: (data as { incomplete_details?: unknown })
              .incomplete_details,
          },
        },
        { status: 502 }
      )
    }

    const payload = parseScenarioFromResponse(data, situation)
    if (!payload) {
      const keys =
        data && typeof data === "object" ? Object.keys(data as object) : []
      const outputTypes =
        data &&
        typeof data === "object" &&
        Array.isArray((data as { output?: unknown }).output)
          ? (data as { output: Array<{ type?: unknown }> }).output.map((item) =>
              typeof item?.type === "string" ? item.type : "unknown"
            )
          : []

      return NextResponse.json(
        {
          error: "Could not parse generated scenario response.",
          debug: { keys, outputTypes },
        },
        { status: 502 }
      )
    }

    return NextResponse.json(payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
