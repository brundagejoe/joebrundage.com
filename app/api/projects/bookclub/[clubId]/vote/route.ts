import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/shared/lib/supabase-server"

const VoteSchema = z.object({
  rankedBookIds: z.array(z.string().uuid()).min(1),
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = VoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please provide a valid ranked list." }, { status: 400 })
  }

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .select("phase, current_round")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (club.phase !== "voting") {
    return NextResponse.json(
      { error: "Voting is not currently open." },
      { status: 409 }
    )
  }

  const { data: books, error: booksError } = await supabase
    .from("bookclub_books")
    .select("id")
    .eq("club_id", clubId)
    .eq("round_number", club.current_round)

  if (booksError) {
    return NextResponse.json({ error: booksError.message }, { status: 500 })
  }

  const currentRoundBookIds = (books ?? []).map((book) => book.id)
  const rankedBookIds = parsed.data.rankedBookIds

  if (new Set(rankedBookIds).size !== rankedBookIds.length) {
    return NextResponse.json(
      { error: "Each book can only be ranked once." },
      { status: 400 }
    )
  }

  if (rankedBookIds.length !== currentRoundBookIds.length) {
    return NextResponse.json(
      { error: "You must rank all submitted books." },
      { status: 400 }
    )
  }

  const expectedIds = new Set(currentRoundBookIds)
  if (rankedBookIds.some((bookId) => !expectedIds.has(bookId))) {
    return NextResponse.json(
      { error: "One or more ranked books are invalid for this round." },
      { status: 400 }
    )
  }

  const { error: clearError } = await supabase
    .from("bookclub_votes")
    .delete()
    .eq("club_id", clubId)
    .eq("round_number", club.current_round)
    .eq("voter_user_id", user.id)

  if (clearError) {
    return NextResponse.json({ error: clearError.message }, { status: 500 })
  }

  const voteRows = rankedBookIds.map((bookId, index) => ({
    club_id: clubId,
    round_number: club.current_round,
    voter_user_id: user.id,
    book_id: bookId,
    rank: index + 1,
  }))

  const { error: insertError } = await supabase.from("bookclub_votes").insert(voteRows)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
