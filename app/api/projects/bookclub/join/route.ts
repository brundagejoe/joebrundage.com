import { NextResponse } from "next/server"
import { z } from "zod"
import { getBookclubByInviteCode, getDisplayName } from "@/shared/lib/bookclub"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

const JoinSchema = z.object({
  inviteCode: z.string().trim().min(4).max(64),
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

  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 })
  }

  const inviteCode = parsed.data.inviteCode
  const { data: club, error: clubError } = await getBookclubByInviteCode(inviteCode)

  if (clubError) {
    return NextResponse.json({ error: clubError.message }, { status: 500 })
  }

  if (!club) {
    return NextResponse.json({ error: "Invite code not found." }, { status: 404 })
  }

  const displayName = getDisplayName(user.user_metadata)

  const { error: joinError } = await supabase.from("bookclub_members").upsert(
    {
      club_id: club.id,
      user_id: user.id,
      role: user.id === club.owner_user_id ? "owner" : "member",
      display_name: displayName,
    },
    { onConflict: "club_id,user_id" }
  )

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 })
  }

  return NextResponse.json({
    clubId: club.id,
    clubName: club.name,
  })
}
