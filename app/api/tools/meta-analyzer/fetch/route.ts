import { NextRequest, NextResponse } from "next/server"

const TIMEOUT_MS = 10_000

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url parameter." }, { status: 400 })
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return NextResponse.json(
      { error: "Only http and https URLs are supported." },
      { status: 400 }
    )
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `HTTP ${response.status} ${response.statusText || "Error"}`,
          status: response.status,
        },
        { status: 502 }
      )
    }

    const html = await response.text()
    return NextResponse.json({ html })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out after 10 seconds." }, { status: 504 })
    }

    const message = error instanceof Error ? error.message : "Unknown network error."
    return NextResponse.json({ error: message }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
