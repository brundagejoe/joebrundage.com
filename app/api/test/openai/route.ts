import { NextResponse } from "next/server"
import { requireAiAccess } from "@/shared/lib/auth"

const OPENAI_URL = "https://api.openai.com/v1/responses"

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
          typeof contentRecord.text === "string" &&
          contentRecord.text.trim().length > 0
        ) {
          chunks.push(contentRecord.text.trim())
        }
      }
    }

    if (chunks.length > 0) {
      return chunks.join(" ")
    }
  }

  return null
}

export async function POST() {
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

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input:
          "Reply with one short sentence proving this API key works. Tell a joke.",
        max_output_tokens: 40,
      }),
      cache: "no-store",
    })

    const data = await response.json()

    if (!response.ok) {
      const message =
        typeof data?.error?.message === "string"
          ? data.error.message
          : "OpenAI request failed."

      return NextResponse.json({ error: message }, { status: response.status })
    }

    const text = extractTextFromResponse(data)

    if (!text) {
      const keys =
        data && typeof data === "object" ? Object.keys(data as object) : []
      return NextResponse.json(
        {
          text: "OpenAI responded, but no output text was found in the expected fields.",
          debug: { keys },
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
