import { NextResponse } from "next/server"
import { z } from "zod"
import { computeRankedChoiceWinner } from "@/shared/lib/bookclub"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

const TransitionSchema = z.object({
  action: z.enum(["start_voting", "end_voting", "reopen_submissions"]),
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = TransitionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid transition action." }, { status: 400 })
  }

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .select("id, owner_user_id, phase, current_round")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (club.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Only the owner can transition phases." }, { status: 403 })
  }

  const action = parsed.data.action

  if (action === "reopen_submissions") {
    const { error: updateError } = await supabase
      .from("bookclubs")
      .update({ phase: "submission" })
      .eq("id", clubId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, phase: "submission" })
  }

  if (action === "start_voting") {
    const targetRound = club.phase === "reading" ? club.current_round + 1 : club.current_round

    const { data: books, error: booksError } = await supabase
      .from("bookclub_books")
      .select("id")
      .eq("club_id", clubId)
      .eq("round_number", targetRound)

    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 })
    }

    if (!books || books.length < 1) {
      return NextResponse.json(
        { error: "At least one submitted book is required before voting." },
        { status: 409 }
      )
    }

    const { error: updateError } = await supabase
      .from("bookclubs")
      .update({ phase: "voting", current_round: targetRound })
      .eq("id", clubId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, phase: "voting", currentRound: targetRound })
  }

  if (club.phase !== "voting") {
    return NextResponse.json(
      { error: "Club must be in voting phase to close voting." },
      { status: 409 }
    )
  }

  const [{ data: books, error: booksError }, { data: votes, error: votesError }] =
    await Promise.all([
      supabase
        .from("bookclub_books")
        .select("id")
        .eq("club_id", clubId)
        .eq("round_number", club.current_round),
      supabase
        .from("bookclub_votes")
        .select("voter_user_id, book_id, rank")
        .eq("club_id", clubId)
        .eq("round_number", club.current_round)
        .order("voter_user_id", { ascending: true })
        .order("rank", { ascending: true }),
    ])

  if (booksError || votesError) {
    return NextResponse.json(
      { error: booksError?.message ?? votesError?.message ?? "Could not tally votes." },
      { status: 500 }
    )
  }

  const candidateIds = (books ?? []).map((book) => book.id)
  if (candidateIds.length === 0) {
    return NextResponse.json(
      { error: "No books were submitted for the current round." },
      { status: 409 }
    )
  }

  const ballotsByVoter = new Map<string, string[]>()
  for (const vote of votes ?? []) {
    const current = ballotsByVoter.get(vote.voter_user_id) ?? []
    current.push(vote.book_id)
    ballotsByVoter.set(vote.voter_user_id, current)
  }

  const ballots = [...ballotsByVoter.values()]
  const result = computeRankedChoiceWinner(candidateIds, ballots)

  if (!result.winnerId) {
    return NextResponse.json(
      { error: "Could not determine a winner from submitted votes." },
      { status: 409 }
    )
  }

  const { error: updateError } = await supabase
    .from("bookclubs")
    .update({ phase: "reading", active_book_id: result.winnerId })
    .eq("id", clubId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    phase: "reading",
    winnerBookId: result.winnerId,
    rounds: result.rounds,
  })
}
