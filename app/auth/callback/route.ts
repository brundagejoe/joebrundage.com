import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

function getSafeRedirectPath(next: string | null) {
  if (!next) {
    return "/test"
  }

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/test"
  }

  return next
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = getSafeRedirectPath(url.searchParams.get("next"))

  if (code) {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(next, request.url))
}
