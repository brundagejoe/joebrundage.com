import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/shared/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request)

  if (!user) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)

    const redirectResponse = NextResponse.redirect(loginUrl)

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })

    return redirectResponse
  }

  return response
}

export const config = {
  matcher: ["/test", "/change-password"],
}
