import { NextResponse } from "next/server"
import { z } from "zod"
import { createSupabaseServerClient } from "@/shared/lib/supabase/server"
import { getSubmissionRound } from "@/shared/lib/bookclub/data"
import { findFuzzyDuplicate, normalizeBookField } from "@/shared/lib/bookclub/text"

const SubmissionSchema = z.object({
  title: z.string().trim().min(1).max(200),
  author: z.string().trim().min(1).max(200),
  lengthHours: z.coerce.number().min(0.25).max(500),
  pitch: z.string().trim().min(1).max(4000),
  duplicateBookId: z.string().uuid().optional(),
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

  const { data: club, error: clubError } = await supabase
    .from("bookclubs")
    .select("phase, current_round")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (club.phase === "voting") {
    return NextResponse.json(
      { error: "Submissions are closed for this round while voting is active." },
      { status: 409 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = SubmissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing or invalid title, author, length, or pitch." },
      { status: 400 }
    )
  }

  const submissionRound = getSubmissionRound(club.phase, club.current_round)

  const { data: existingPitch, error: existingPitchError } = await supabase
    .from("bookclub_pitches")
    .select("id")
    .eq("club_id", clubId)
    .eq("round_number", submissionRound)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingPitchError) {
    return NextResponse.json({ error: existingPitchError.message }, { status: 500 })
  }

  if (existingPitch) {
    return NextResponse.json(
      {
        error:
          "You already submitted for this round. Remove your submission before submitting again.",
      },
      { status: 409 }
    )
  }

  const { data: existingBooks, error: booksError } = await supabase
    .from("bookclub_books")
    .select("id, title, author, normalized_title, normalized_author")
    .eq("club_id", clubId)
    .eq("round_number", submissionRound)

  if (booksError) {
    return NextResponse.json({ error: booksError.message }, { status: 500 })
  }

  const duplicate = findFuzzyDuplicate(existingBooks ?? [], {
    title: parsed.data.title,
    author: parsed.data.author,
  })

  const duplicateBookId = parsed.data.duplicateBookId

  if (duplicate && duplicate.id !== duplicateBookId) {
    return NextResponse.json(
      {
        error: "This book already exists in this round.",
        duplicate: {
          id: duplicate.id,
          title: duplicate.title,
          author: duplicate.author,
        },
      },
      { status: 409 }
    )
  }

  let bookId: string | null = duplicateBookId ?? duplicate?.id ?? null

  if (!bookId) {
    const { data: createdBook, error: createBookError } = await supabase
      .from("bookclub_books")
      .insert({
        club_id: clubId,
        round_number: submissionRound,
        title: parsed.data.title,
        author: parsed.data.author,
        length_hours: parsed.data.lengthHours,
        normalized_title: normalizeBookField(parsed.data.title),
        normalized_author: normalizeBookField(parsed.data.author),
        created_by_user_id: user.id,
      })
      .select("id")
      .single()

    if (createBookError || !createdBook) {
      return NextResponse.json(
        { error: createBookError?.message ?? "Could not create book entry." },
        { status: 500 }
      )
    }

    bookId = createdBook.id
  }

  const { error: pitchError } = await supabase.from("bookclub_pitches").insert(
    {
      club_id: clubId,
      round_number: submissionRound,
      user_id: user.id,
      book_id: bookId,
      pitch: parsed.data.pitch,
    }
  )

  if (pitchError) {
    return NextResponse.json({ error: pitchError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, submissionRound })
}

export async function DELETE(
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
    .select("phase, current_round")
    .eq("id", clubId)
    .single()

  if (clubError || !club) {
    return NextResponse.json({ error: clubError?.message ?? "Club not found." }, { status: 404 })
  }

  if (club.phase === "voting") {
    return NextResponse.json(
      { error: "Cannot remove submission while voting is active." },
      { status: 409 }
    )
  }

  const submissionRound = getSubmissionRound(club.phase, club.current_round)

  const { data: existingPitch, error: existingPitchError } = await supabase
    .from("bookclub_pitches")
    .select("id, book_id")
    .eq("club_id", clubId)
    .eq("round_number", submissionRound)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingPitchError) {
    return NextResponse.json({ error: existingPitchError.message }, { status: 500 })
  }

  if (!existingPitch) {
    return NextResponse.json({ ok: true, deleted: false })
  }

  const { error: deleteError } = await supabase
    .from("bookclub_pitches")
    .delete()
    .eq("id", existingPitch.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const { data: remainingOnBook, error: remainingOnBookError } = await supabase
    .from("bookclub_pitches")
    .select("id")
    .eq("club_id", clubId)
    .eq("round_number", submissionRound)
    .eq("book_id", existingPitch.book_id)
    .limit(1)

  if (remainingOnBookError) {
    return NextResponse.json({ error: remainingOnBookError.message }, { status: 500 })
  }

  if (!remainingOnBook || remainingOnBook.length === 0) {
    const { error: cleanupError } = await supabase
      .from("bookclub_books")
      .delete()
      .eq("id", existingPitch.book_id)
      .eq("club_id", clubId)
      .eq("round_number", submissionRound)

    if (cleanupError) {
      return NextResponse.json({ error: cleanupError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, deleted: true })
}
