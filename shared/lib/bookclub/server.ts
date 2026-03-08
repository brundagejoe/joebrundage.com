import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/shared/lib/supabase"

export async function requireAuthedUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
      user: null,
    }
  }

  return { supabase, user, response: null as NextResponse<unknown> | null }
}

export async function requireBookclubMember(clubId: string, user: User) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from("bookclub_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return {
      isMember: false,
      isOwner: false,
      response: NextResponse.json({ error: error.message }, { status: 500 }),
    }
  }

  if (!data) {
    return {
      isMember: false,
      isOwner: false,
      response: NextResponse.json({ error: "Not a member of this bookclub." }, { status: 403 }),
    }
  }

  return {
    isMember: true,
    isOwner: data.role === "owner",
    response: null as NextResponse<unknown> | null,
  }
}
