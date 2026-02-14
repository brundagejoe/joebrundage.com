import { NextResponse } from "next/server"
import { z } from "zod"
import {
  extractProviderErrorMessage,
  getStructuredJsonCandidates,
  getTextFallbackJsonCandidate,
  OPENAI_RESPONSES_URL,
} from "@/shared/lib/ai/openai-responses"
import { requireAiAccess } from "@/shared/lib/auth/ai-access"

const RequestSchema = z.object({
  situation: z.string().trim().min(1),
})

const ExpectedValueScenarioSchema = z
  .object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    probabilityLabel: z.string().trim().min(1),
    successLabel: z.string().trim().min(1),
    failureLabel: z.string().trim().min(1),
    probabilityPercent: z.number(),
    successOutcome: z.number(),
    failureOutcome: z.number(),
  })
  .strict()

type ExpectedValueScenarioPayload = z.infer<typeof ExpectedValueScenarioSchema>

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

function normalizeFiniteNumber(value: unknown, fallback: number): number {
  const parsed = z.coerce.number().safeParse(value)
  if (!parsed.success || !Number.isFinite(parsed.data)) {
    return fallback
  }
  return parsed.data
}

function normalizeExpectedValueScenario(
  value: unknown,
  situation: string
): ExpectedValueScenarioPayload | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const fallbackTitle = "Custom"
  const fallbackDescription = `Expected value setup tailored to: ${situation}`

  const candidate = {
    title: z.string().trim().min(1).catch(fallbackTitle).parse(record.title),
    description: z
      .string()
      .trim()
      .min(1)
      .catch(fallbackDescription)
      .parse(record.description),
    probabilityLabel: z
      .string()
      .trim()
      .min(1)
      .catch("Probability the favorable outcome occurs.")
      .parse(record.probabilityLabel),
    successLabel: z
      .string()
      .trim()
      .min(1)
      .catch("Net gain if the favorable outcome occurs.")
      .parse(record.successLabel),
    failureLabel: z
      .string()
      .trim()
      .min(1)
      .catch("Net gain (or loss) if the favorable outcome does not occur.")
      .parse(record.failureLabel),
    probabilityPercent: normalizeFiniteNumber(record.probabilityPercent, 50),
    successOutcome: normalizeFiniteNumber(record.successOutcome, 100),
    failureOutcome: normalizeFiniteNumber(record.failureOutcome, -50),
  }

  const parsed = ExpectedValueScenarioSchema.safeParse(candidate)
  if (!parsed.success) {
    return null
  }

  return {
    ...parsed.data,
    probabilityPercent: clamp(parsed.data.probabilityPercent, 0, 100),
  }
}

function parseScenarioFromResponse(
  data: unknown,
  situation: string
): ExpectedValueScenarioPayload | null {
  const candidates = getStructuredJsonCandidates(data)
  for (const candidate of candidates) {
    const parsed = normalizeExpectedValueScenario(candidate, situation)
    if (parsed) {
      return parsed
    }
  }

  const textCandidate = getTextFallbackJsonCandidate(data)
  if (!textCandidate) {
    return null
  }

  return normalizeExpectedValueScenario(textCandidate, situation)
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

  const input = `You are creating an Expected Value Primer example.

Return exactly one JSON object with these keys and only these keys:
- title
- description
- probabilityLabel
- successLabel
- failureLabel
- probabilityPercent
- successOutcome
- failureOutcome

Rules:
- title: short button label, 2 to 4 words.
- description: one sentence explaining why expected value matters for this situation.
- Labels: plain language and specific to the situation.
- probabilityPercent must be a number between 0 and 100.
- successOutcome and failureOutcome must be realistic net outcomes for one decision (can be negative).
- Use realistic but educational starter values.
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
        model: "gpt-5-mini",
        input,
        reasoning: {
          effort: "minimal",
        },
        text: {
          format: {
            type: "json_schema",
            name: "expected_value_custom_scenario",
            schema: {
              type: "object",
              additionalProperties: false,
              required: [
                "title",
                "description",
                "probabilityLabel",
                "successLabel",
                "failureLabel",
                "probabilityPercent",
                "successOutcome",
                "failureOutcome",
              ],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                probabilityLabel: { type: "string" },
                successLabel: { type: "string" },
                failureLabel: { type: "string" },
                probabilityPercent: {
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                },
                successOutcome: { type: "number" },
                failureOutcome: { type: "number" },
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
