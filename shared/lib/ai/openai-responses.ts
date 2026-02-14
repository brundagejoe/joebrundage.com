export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"

export function extractProviderErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof (data.error as { message?: unknown }).message === "string"
  ) {
    return (data.error as { message: string }).message
  }

  return fallback
}

export function extractTextFromResponse(data: unknown): string | null {
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

export function getStructuredJsonCandidates(data: unknown): unknown[] {
  if (!data || typeof data !== "object") {
    return []
  }

  const candidates: unknown[] = []
  const record = data as Record<string, unknown>

  if ("output_parsed" in record) {
    candidates.push(record.output_parsed)
  }

  if (!Array.isArray(record.output)) {
    return candidates
  }

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
        candidates.push(contentRecord.json)
      }
      if ("parsed" in contentRecord) {
        candidates.push(contentRecord.parsed)
      }
    }
  }

  return candidates
}

export function parseFirstJsonObjectFromText(text: string): unknown | null {
  const firstBrace = text.indexOf("{")
  const lastBrace = text.lastIndexOf("}")
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    return null
  }

  const jsonSlice = text.slice(firstBrace, lastBrace + 1)

  try {
    return JSON.parse(jsonSlice)
  } catch {
    return null
  }
}

export function getTextFallbackJsonCandidate(data: unknown): unknown | null {
  const outputText = extractTextFromResponse(data)
  if (!outputText) {
    return null
  }
  return parseFirstJsonObjectFromText(outputText)
}
