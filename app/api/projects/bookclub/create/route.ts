import { NextResponse } from "next/server"
import { z } from "zod"
import { getDisplayName } from "@/shared/lib/bookclub"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

const CreateBookclubSchema = z.object({
  name: z.string().trim().min(2).max(80),
})

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = CreateBookclubSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bookclub name must be between 2 and 80 characters." },
      { status: 400 }
    )
  }

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .insert({
      name: parsed.data.name,
      owner_user_id: user.id,
    })
    .select("id, invite_code")
    .single()

  if (clubError || !club) {
    return NextResponse.json(
      { error: clubError?.message ?? "Could not create bookclub." },
      { status: 500 }
    )
  }

  const displayName = getDisplayName(user.user_metadata)

  const { error: memberError } = await supabase.from("bookclub_members").insert({
    club_id: club.id,
    user_id: user.id,
    role: "owner",
    display_name: displayName,
  })

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 })
  }

  return NextResponse.json({
    clubId: club.id,
    inviteCode: club.invite_code,
    joinUrl: `/projects/bookclub/join/${club.invite_code}`,
  })
}
