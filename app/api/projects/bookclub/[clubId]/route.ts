import { NextResponse } from "next/server"
import { getSubmissionRound } from "@/shared/lib/bookclub"
import { createSupabaseServerClient } from "@/shared/lib/supabase"

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
    .select("id, name, owner_user_id, invite_code, phase, current_round, meeting_at, active_book_id")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  const rounds = [club.current_round]
  const submissionRound = getSubmissionRound(club.phase, club.current_round)
  if (submissionRound !== club.current_round) {
    rounds.push(submissionRound)
  }

  const [membersResult, booksResult, pitchesResult, myVotesResult] = await Promise.all([
    supabase
      .from("bookclub_members")
      .select("user_id, role, joined_at, display_name")
      .eq("club_id", clubId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("bookclub_books")
      .select(
        "id, club_id, round_number, title, author, length_hours, normalized_title, normalized_author, created_by_user_id, created_at"
      )
      .eq("club_id", clubId)
      .in("round_number", rounds)
      .order("created_at", { ascending: true }),
    supabase
      .from("bookclub_pitches")
      .select("id, club_id, round_number, book_id, user_id, pitch, created_at, updated_at")
      .eq("club_id", clubId)
      .in("round_number", rounds)
      .order("created_at", { ascending: true }),
    supabase
      .from("bookclub_votes")
      .select("book_id, rank, round_number")
      .eq("club_id", clubId)
      .eq("voter_user_id", user.id)
      .eq("round_number", club.current_round)
      .order("rank", { ascending: true }),
  ])

  if (membersResult.error || booksResult.error || pitchesResult.error || myVotesResult.error) {
    return NextResponse.json(
      {
        error:
          membersResult.error?.message ||
          booksResult.error?.message ||
          pitchesResult.error?.message ||
          myVotesResult.error?.message ||
          "Could not load club.",
      },
      { status: 500 }
    )
  }

  const members = membersResult.data ?? []
  const books = booksResult.data ?? []
  const pitches = pitchesResult.data ?? []
  const myVotes = myVotesResult.data ?? []
  const pitchedBookIds = new Set(pitches.map((pitch) => pitch.book_id))
  const booksWithPitches = books.filter((book) => pitchedBookIds.has(book.id))

  const votesSubmittedCountResult = await supabase
    .from("bookclub_votes")
    .select("voter_user_id")
    .eq("club_id", clubId)
    .eq("round_number", club.current_round)

  if (votesSubmittedCountResult.error) {
    return NextResponse.json({ error: votesSubmittedCountResult.error.message }, { status: 500 })
  }

  const uniqueVoters = new Set(
    (votesSubmittedCountResult.data ?? []).map((row) => row.voter_user_id)
  )

  let firstChoiceVotes: Record<string, number> = {}
  if (membership.role === "owner") {
    const { data: ownerVotes, error: ownerVotesError } = await supabase
      .from("bookclub_votes")
      .select("book_id, rank")
      .eq("club_id", clubId)
      .eq("round_number", club.current_round)
      .eq("rank", 1)

    if (ownerVotesError) {
      return NextResponse.json({ error: ownerVotesError.message }, { status: 500 })
    }

    firstChoiceVotes = (ownerVotes ?? []).reduce<Record<string, number>>((acc, vote) => {
      acc[vote.book_id] = (acc[vote.book_id] ?? 0) + 1
      return acc
    }, {})
  }

  return NextResponse.json({
    currentUserId: user.id,
    club: {
      id: club.id,
      name: club.name,
      ownerUserId: club.owner_user_id,
      inviteCode: club.invite_code,
      phase: club.phase,
      currentRound: club.current_round,
      submissionRound,
      meetingAt: club.meeting_at,
      activeBookId: club.active_book_id,
      isOwner: membership.role === "owner",
    },
    members: members.map((member) => ({
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      displayName: member.display_name,
    })),
    books: booksWithPitches.map((book) => ({
      id: book.id,
      clubId: book.club_id,
      roundNumber: book.round_number,
      title: book.title,
      author: book.author,
      lengthHours: Number(book.length_hours),
      normalizedTitle: book.normalized_title,
      normalizedAuthor: book.normalized_author,
      createdByUserId: book.created_by_user_id,
      createdAt: book.created_at,
      firstChoiceVotes: firstChoiceVotes[book.id] ?? 0,
    })),
    pitches: pitches.map((pitch) => ({
      id: pitch.id,
      clubId: pitch.club_id,
      roundNumber: pitch.round_number,
      bookId: pitch.book_id,
      userId: pitch.user_id,
      pitch: pitch.pitch,
      createdAt: pitch.created_at,
      updatedAt: pitch.updated_at,
    })),
    myVotes,
    votesSubmittedCount: uniqueVoters.size,
    memberCount: members.length,
  })
}
