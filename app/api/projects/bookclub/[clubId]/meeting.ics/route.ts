import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { buildIcsContent } from "@/shared/lib/bookclub/calendar"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const { clubId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from("bookclub_members")
    .select("role")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 })
  }

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this club." }, { status: 403 })
  }

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .select("id, name, meeting_at")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (!club.meeting_at) {
    return NextResponse.json({ error: "Meeting date has not been set." }, { status: 409 })
  }

  const icsContent = buildIcsContent({
    title: `${club.name} Book Club Meeting`,
    description: "Book club discussion meeting",
    startIso: club.meeting_at,
    uid: `${club.id}@joebrundage.com`,
  })

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookclub-${club.id}.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
