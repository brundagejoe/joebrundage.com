import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { buildGoogleCalendarLink } from "@/shared/lib/bookclub/calendar"

const MeetingSchema = z.object({
  meetingAt: z.string().datetime({ offset: true }),
})

export async function POST(
  request: Request,
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

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .select("id, name, owner_user_id, phase")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (club.owner_user_id !== user.id) {
    return NextResponse.json(
      { error: "Only the owner can set the meeting date." },
      { status: 403 }
    )
  }

  if (club.phase !== "reading") {
    return NextResponse.json(
      { error: "Meeting date can be set after voting is closed." },
      { status: 409 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = MeetingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid meeting datetime." }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from("bookclubs")
    .update({ meeting_at: parsed.data.meetingAt })
    .eq("id", clubId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    meetingAt: parsed.data.meetingAt,
    googleCalendarUrl: buildGoogleCalendarLink({
      title: `${club.name} Book Club Meeting`,
      description: "Book club discussion meeting",
      startIso: parsed.data.meetingAt,
    }),
    icsUrl: `/api/projects/bookclub/${clubId}/meeting.ics`,
  })
}
