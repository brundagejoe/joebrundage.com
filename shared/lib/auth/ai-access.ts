import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { getAllowedAiRoles } from "@/shared/config/ai"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"

export function resolveUserRole(user: User): string | null {
  const appRole = user.app_metadata?.role
  if (typeof appRole === "string" && appRole.trim().length > 0) {
    return appRole.trim()
  }

  const profileRole = user.user_metadata?.role
  if (typeof profileRole === "string" && profileRole.trim().length > 0) {
    return profileRole.trim()
  }

  return null
}

export function canAccessAi(user: User): boolean {
  const allowedRoles = getAllowedAiRoles()
  if (allowedRoles.length === 0) {
    return true
  }

  const role = resolveUserRole(user)
  return role ? allowedRoles.includes(role) : false
}

export async function requireAiAccess() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized. Please log in to use AI features." },
        { status: 401 }
      ),
    }
  }

  if (!canAccessAi(user)) {
    return {
      response: NextResponse.json(
        { error: "Forbidden. Your account is not allowed to use AI features." },
        { status: 403 }
      ),
    }
  }

  return { user }
}
