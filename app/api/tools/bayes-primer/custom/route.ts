import { NextResponse } from "next/server"
import { requireAiAccess } from "@/shared/lib/auth/ai-access"

const OPENAI_URL = "https://api.openai.com/v1/responses"

type CustomScenarioPayload = {
  title: string
  description: string
  priorLabel: string
  likelihoodLabel: string
  falsePositiveLabel: string
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
}

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

function normalizeText(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function normalizePercent(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback
  }
  return clamp(value, 0, 100)
}

function normalizeScenarioPayload(
  value: unknown,
  situation: string
): CustomScenarioPayload | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const record = value as Record<string, unknown>
  const fallbackTitle = "Custom"
  const fallbackDescription = `Bayes setup tailored to: ${situation}`

  return {
    title: normalizeText(record.title, fallbackTitle),
    description: normalizeText(record.description, fallbackDescription),
    priorLabel: normalizeText(
      record.priorLabel,
      "Chance the underlying claim is true before seeing this evidence."
    ),
    likelihoodLabel: normalizeText(
      record.likelihoodLabel,
      "If the claim is true, chance this evidence appears."
    ),
    falsePositiveLabel: normalizeText(
      record.falsePositiveLabel,
      "If the claim is false, chance this evidence still appears."
    ),
    priorPercent: normalizePercent(record.priorPercent, 10),
    truePositivePercent: normalizePercent(record.truePositivePercent, 80),
    falsePositivePercent: normalizePercent(record.falsePositivePercent, 15),
  }
}

function extractTextFromResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>

  if (
    typeof record.output_text === "string" &&
    record.output_text.trim().length > 0
  ) {
    return record.output_text.trim()
  }

  if (
    record.output_text &&
    typeof record.output_text === "object" &&
    "value" in record.output_text &&
    typeof (record.output_text as { value?: unknown }).value === "string" &&
    (record.output_text as { value: string }).value.trim().length > 0
  ) {
    return (record.output_text as { value: string }).value.trim()
  }

  if (Array.isArray(record.output_text)) {
    const joined = record.output_text
      .map((part) => {
        if (typeof part === "string") {
          return part
        }
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        ) {
          return ((part as { text: string }).text || "").trim()
        }
        return ""
      })
      .filter((value) => value.length > 0)
      .join(" ")

    if (joined.length > 0) {
      return joined
    }
  }

  if (Array.isArray(record.output)) {
    const chunks: string[] = []

    for (const item of record.output) {
      if (!item || typeof item !== "object") {
        continue
      }

      const outputItem = item as Record<string, unknown>
      if (!Array.isArray(outputItem.content)) {
        continue
      }

      for (const contentPart of outputItem.content) {
        if (!contentPart || typeof contentPart !== "object") {
          continue
        }

        const contentRecord = contentPart as Record<string, unknown>
        if (
          (contentRecord.type === "output_text" ||
            contentRecord.type === "text") &&
          typeof contentRecord.text === "string"
        ) {
          const trimmed = contentRecord.text.trim()
          if (trimmed.length > 0) {
            chunks.push(trimmed)
          }
        }

        if (
          (contentRecord.type === "output_text" ||
            contentRecord.type === "text") &&
          contentRecord.text &&
          typeof contentRecord.text === "object" &&
          "value" in contentRecord.text &&
          typeof (contentRecord.text as { value?: unknown }).value === "string"
        ) {
          const trimmed = (
            contentRecord.text as { value: string }
          ).value.trim()
          if (trimmed.length > 0) {
            chunks.push(trimmed)
          }
        }

        if (
          (contentRecord.type === "output_text" ||
            contentRecord.type === "text") &&
          Array.isArray(contentRecord.text)
        ) {
          for (const part of contentRecord.text) {
            if (typeof part === "string" && part.trim().length > 0) {
              chunks.push(part.trim())
              continue
            }
            if (
              part &&
              typeof part === "object" &&
              "value" in part &&
              typeof (part as { value?: unknown }).value === "string" &&
              (part as { value: string }).value.trim().length > 0
            ) {
              chunks.push((part as { value: string }).value.trim())
            }
          }
        }

        if (
          (contentRecord.type === "output_json" ||
            contentRecord.type === "json") &&
          contentRecord.json &&
          typeof contentRecord.json === "object"
        ) {
          chunks.push(JSON.stringify(contentRecord.json))
        }
      }
    }

    if (chunks.length > 0) {
      return chunks.join(" ")
    }
  }

  return null
}

function parseScenarioFromText(
  text: string,
  situation: string
): CustomScenarioPayload | null {
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null
  }

  const jsonSlice = text.slice(firstBrace, lastBrace + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonSlice)
  } catch {
    return null
  }

  return normalizeScenarioPayload(parsed, situation)
}

function parseScenarioFromResponse(
  data: unknown,
  situation: string
): CustomScenarioPayload | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const record = data as Record<string, unknown>

  if ("output_parsed" in record) {
    const parsedPayload = normalizeScenarioPayload(record.output_parsed, situation)
    if (parsedPayload) {
      return parsedPayload
    }
  }

  if (Array.isArray(record.output)) {
    for (const item of record.output) {
      if (!item || typeof item !== "object") {
        continue
      }

      const outputItem = item as Record<string, unknown>
      if (!Array.isArray(outputItem.content)) {
        continue
      }

      for (const contentPart of outputItem.content) {
        if (!contentPart || typeof contentPart !== "object") {
          continue
        }

        const contentRecord = contentPart as Record<string, unknown>

        if ("json" in contentRecord) {
          const parsedPayload = normalizeScenarioPayload(
            contentRecord.json,
            situation
          )
          if (parsedPayload) {
            return parsedPayload
          }
        }

        if ("parsed" in contentRecord) {
          const parsedPayload = normalizeScenarioPayload(
            contentRecord.parsed,
            situation
          )
          if (parsedPayload) {
            return parsedPayload
          }
        }
      }
    }
  }

  const outputText = extractTextFromResponse(data)
  if (!outputText) {
    return null
  }

  return parseScenarioFromText(outputText, situation)
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

  const situation =
    body && typeof body === "object" && "situation" in body
      ? String((body as { situation?: unknown }).situation ?? "").trim()
      : ""

  if (situation.length === 0) {
    return NextResponse.json(
      { error: "The situation field is required." },
      { status: 400 }
    )
  }

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
    const response = await fetch(OPENAI_URL, {
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
                truePositivePercent: { type: "number", minimum: 0, maximum: 100 },
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
    const serializedData =
      data && typeof data === "object"
        ? JSON.stringify(data)
        : String(data ?? "")

    console.info("[bayes-custom] OpenAI status:", response.status)
    console.info("[bayes-custom] OpenAI payload:", serializedData)

    if (!response.ok) {
      const message =
        typeof data?.error?.message === "string"
          ? data.error.message
          : "OpenAI request failed."

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
            incomplete_details: (
              data as { incomplete_details?: unknown }
            ).incomplete_details,
          },
        },
        { status: 502 }
      )
    }

    const payload = parseScenarioFromResponse(data, situation)
    console.info("[bayes-custom] Parsed payload:", payload)
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
