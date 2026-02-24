import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("bookclub_members")
    .select("club_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })

  if (membershipsError) {
    return NextResponse.json({ error: membershipsError.message }, { status: 500 })
  }

  const clubIds = (memberships ?? []).map((membership) => membership.club_id)
  if (clubIds.length === 0) {
    return NextResponse.json({ clubs: [] })
  }

  const { data: clubs, error: clubsError } = await supabase
    .from("bookclubs")
    .select("id, name, invite_code, owner_user_id, phase, current_round, meeting_at, active_book_id, created_at")
    .in("id", clubIds)
    .order("created_at", { ascending: false })

  if (clubsError) {
    return NextResponse.json({ error: clubsError.message }, { status: 500 })
  }

  const membershipsByClub = new Map(
    (memberships ?? []).map((membership) => [membership.club_id, membership])
  )

  return NextResponse.json({
    clubs: (clubs ?? []).map((club) => {
      const membership = membershipsByClub.get(club.id)
      return {
        id: club.id,
        name: club.name,
        inviteCode: club.invite_code,
        ownerUserId: club.owner_user_id,
        phase: club.phase,
        currentRound: club.current_round,
        meetingAt: club.meeting_at,
        activeBookId: club.active_book_id,
        isOwner: membership?.role === "owner",
      }
    }),
  })
}
