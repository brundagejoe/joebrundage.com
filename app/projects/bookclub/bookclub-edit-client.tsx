"use client"

import * as React from "react"
import NextLink from "next/link"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Section } from "@/shared/ui/plate"
import { Textarea } from "@/shared/ui/textarea"

type ClubResponse = {
  currentUserId: string
  club: {
    id: string
    name: string
    ownerUserId: string
    inviteCode: string
    phase: "submission" | "voting" | "reading"
    currentRound: number
    submissionRound: number
    meetingAt: string | null
    activeBookId: string | null
    isOwner: boolean
  }
  members: {
    userId: string
    role: "owner" | "member"
    joinedAt: string
    displayName: string
  }[]
  books: {
    id: string
    clubId: string
    roundNumber: number
    title: string
    author: string
    lengthHours: number
    normalizedTitle: string
    normalizedAuthor: string
    createdByUserId: string
    createdAt: string
    firstChoiceVotes: number
  }[]
  pitches: {
    id: string
    clubId: string
    roundNumber: number
    bookId: string
    userId: string
    pitch: string
    createdAt: string
    updatedAt: string
  }[]
  myVotes: { book_id: string; rank: number; round_number: number }[]
  votesSubmittedCount: number
  memberCount: number
}

type BookclubEditClientProps = {
  clubId: string
  isAuthed: boolean
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled"
  }

  const date = new Date(value)
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function toDatetimeLocalInputValue(isoDate: string | null): string {
  if (!isoDate) {
    return ""
  }

  const date = new Date(isoDate)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const localDate = new Date(date.getTime() - offsetMs)
  return localDate.toISOString().slice(0, 16)
}

function buildGoogleCalendarLink(clubName: string, startIso: string): string {
  const start = new Date(startIso)
  const end = new Date(start.getTime() + 90 * 60 * 1000)

  const formatIcsDate = (value: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(value.getUTCSeconds())}Z`
  }

  const url = new URL("https://calendar.google.com/calendar/render")
  url.searchParams.set("action", "TEMPLATE")
  url.searchParams.set("text", `${clubName} Book Club Meeting`)
  url.searchParams.set("details", "Book club discussion meeting")
  url.searchParams.set("dates", `${formatIcsDate(start)}/${formatIcsDate(end)}`)
  return url.toString()
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = (await response.json()) as T & {
    error?: string
    duplicate?: { id: string; title: string; author: string }
  }

  if (!response.ok) {
    const error = new Error(data.error ?? "Request failed") as Error & {
      status?: number
      duplicate?: { id: string; title: string; author: string }
    }
    error.status = response.status
    error.duplicate = data.duplicate
    throw error
  }

  return data
}

export function BookclubEditClient({ clubId, isAuthed }: BookclubEditClientProps) {
  const [data, setData] = React.useState<ClubResponse | null>(null)
  const [loading, setLoading] = React.useState(isAuthed)
  const [error, setError] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const [title, setTitle] = React.useState("")
  const [author, setAuthor] = React.useState("")
  const [lengthHours, setLengthHours] = React.useState("")
  const [pitch, setPitch] = React.useState("")
  const [duplicateBook, setDuplicateBook] = React.useState<{
    id: string
    title: string
    author: string
  } | null>(null)

  const [rankedBookIds, setRankedBookIds] = React.useState<string[]>([])
  const [meetingAtInput, setMeetingAtInput] = React.useState("")

  const loadClub = React.useCallback(async () => {
    if (!isAuthed) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const clubData = await requestJson<ClubResponse>(`/api/projects/bookclub/${clubId}`)
      setData(clubData)
      setError(null)
      setMeetingAtInput(toDatetimeLocalInputValue(clubData.club.meetingAt))

      const currentRoundBooks = clubData.books.filter(
        (book) => book.roundNumber === clubData.club.currentRound
      )

      const myVotesSorted = [...clubData.myVotes].sort((left, right) => left.rank - right.rank)
      if (myVotesSorted.length === currentRoundBooks.length) {
        setRankedBookIds(myVotesSorted.map((vote) => vote.book_id))
      } else {
        setRankedBookIds(currentRoundBooks.map((book) => book.id))
      }

      const mySubmissionForRound = clubData.pitches.find(
        (pitchEntry) =>
          pitchEntry.userId === clubData.currentUserId &&
          pitchEntry.roundNumber === clubData.club.submissionRound
      )

      if (mySubmissionForRound) {
        const submittedBook = clubData.books.find(
          (book) => book.id === mySubmissionForRound.bookId
        )

        if (submittedBook) {
          setTitle(submittedBook.title)
          setAuthor(submittedBook.author)
          setLengthHours(String(submittedBook.lengthHours))
          setPitch(mySubmissionForRound.pitch)
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load bookclub.")
    } finally {
      setLoading(false)
    }
  }, [clubId, isAuthed])

  React.useEffect(() => {
    void loadClub()
  }, [loadClub])

  const submitPitch = async (duplicateBookId?: string) => {
    if (!data) {
      return
    }

    setBusy(true)
    try {
      await requestJson(`/api/projects/bookclub/${clubId}/submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          author,
          lengthHours: Number(lengthHours),
          pitch,
          duplicateBookId,
        }),
      })
      setDuplicateBook(null)
      await loadClub()
    } catch (submitError) {
      if (
        submitError instanceof Error &&
        "status" in submitError &&
        (submitError as Error & { status?: number }).status === 409 &&
        "duplicate" in submitError
      ) {
        const duplicate = (submitError as Error & {
          duplicate?: { id: string; title: string; author: string }
        }).duplicate
        if (duplicate) {
          setDuplicateBook(duplicate)
          setError(null)
          return
        }
      }

      setError(submitError instanceof Error ? submitError.message : "Could not submit pitch.")
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitPitch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitPitch()
  }

  const handleVoteSubmit = async () => {
    if (!data) {
      return
    }

    setBusy(true)
    try {
      await requestJson(`/api/projects/bookclub/${clubId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rankedBookIds }),
      })
      await loadClub()
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Could not submit vote.")
    } finally {
      setBusy(false)
    }
  }

  const handleRemoveSubmission = async () => {
    if (!data) {
      return
    }

    setBusy(true)
    try {
      await requestJson(`/api/projects/bookclub/${clubId}/submission`, {
        method: "DELETE",
      })
      setTitle("")
      setAuthor("")
      setLengthHours("")
      setPitch("")
      setDuplicateBook(null)
      await loadClub()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove submission.")
    } finally {
      setBusy(false)
    }
  }

  const runTransition = async (
    action: "start_voting" | "end_voting" | "reopen_submissions"
  ) => {
    setBusy(true)
    try {
      await requestJson(`/api/projects/bookclub/${clubId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      await loadClub()
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Could not update round state."
      )
    } finally {
      setBusy(false)
    }
  }

  const setMeetingDate = async () => {
    if (!meetingAtInput) {
      return
    }

    setBusy(true)
    try {
      await requestJson(`/api/projects/bookclub/${clubId}/meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingAt: new Date(meetingAtInput).toISOString(),
        }),
      })
      await loadClub()
    } catch (meetingError) {
      setError(meetingError instanceof Error ? meetingError.message : "Could not set meeting date.")
    } finally {
      setBusy(false)
    }
  }

  const moveRank = (index: number, direction: -1 | 1) => {
    setRankedBookIds((previous) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= previous.length) {
        return previous
      }

      const copy = [...previous]
      const temp = copy[index]
      copy[index] = copy[nextIndex]
      copy[nextIndex] = temp
      return copy
    })
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <section className="mx-auto max-w-3xl px-6 py-10">
          <p className="opacity-65">Log in to access this bookclub.</p>
          <NextLink
            className="mt-4 inline-block"
            href={`/login?next=/projects/bookclub/${clubId}/edit`}
          >
            <Button>Log in</Button>
          </NextLink>
        </section>
      </div>
    )
  }

  const club = data?.club
  const memberMap = new Map((data?.members ?? []).map((member) => [member.userId, member]))
  const currentRoundBooks = (data?.books ?? []).filter(
    (book) => book.roundNumber === (club?.currentRound ?? 0)
  )
  const submissionRoundBooks = (data?.books ?? []).filter(
    (book) => book.roundNumber === (club?.submissionRound ?? 0)
  )

  const booksById = new Map((data?.books ?? []).map((book) => [book.id, book]))
  const pitchesByBook = (data?.pitches ?? []).reduce<Record<string, ClubResponse["pitches"]>>(
    (acc, pitchEntry) => {
      const existing = acc[pitchEntry.bookId] ?? []
      existing.push(pitchEntry)
      acc[pitchEntry.bookId] = existing
      return acc
    },
    {}
  )

  const winningBook = club?.activeBookId ? booksById.get(club.activeBookId) : null
  const currentUserId = data?.currentUserId
  const currentUserPitches = (data?.pitches ?? []).filter(
    (entry) => entry.userId === currentUserId
  )
  const myPitchedBooksThisSubmissionRound = submissionRoundBooks.filter((book) =>
    (pitchesByBook[book.id] ?? []).some((entry) => entry.userId === currentUserId)
  )
  const mySubmissionForRound = data
    ? data.pitches.find(
        (entry) =>
          entry.userId === data.currentUserId &&
          entry.roundNumber === data.club.submissionRound
      )
    : null

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-10">
        {loading && !data ? <p className="opacity-50">Loading…</p> : null}

        {data && club ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[1.9rem] leading-tight">{club.name}</h1>
                <p className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70 mt-2">
                  Session <span className="plate-data">{club.currentRound}</span> · {club.phase}
                </p>
                <p className="mt-3 opacity-65">
                  This edit page only shows and edits your own content.
                </p>
              </div>
              <NextLink href={`/projects/bookclub/${clubId}`}>
                <Button variant="outline">Back to Info</Button>
              </NextLink>
            </div>

            {error ? <p className="mt-6 text-[0.85em] text-destructive">{error}</p> : null}

            <section>
              <Section>Invite</Section>
              <p className="mt-3 opacity-65">Share this link for others to join.</p>
              <div className="mt-4 space-y-3">
                <p className="plate-data break-all text-[1rem]">
                  {typeof window === "undefined"
                    ? `/projects/bookclub/join/${club.inviteCode}`
                    : `${window.location.origin}/projects/bookclub/join/${club.inviteCode}`}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = `${window.location.origin}/projects/bookclub/join/${club.inviteCode}`
                    void navigator.clipboard.writeText(link)
                  }}
                >
                  Copy invite link
                </Button>
              </div>
            </section>

            <section>
              <Section>Your submissions &amp; pitches</Section>
              <p className="mt-3 opacity-65">
                Your entries for session <span className="plate-figures">{club.submissionRound}</span>, including pitches you added to books submitted by others.
              </p>
              <div className="mt-4">
                {myPitchedBooksThisSubmissionRound.length === 0 ? (
                  <p className="opacity-50">
                    You have not submitted a pitch for this session yet.
                  </p>
                ) : null}
                {myPitchedBooksThisSubmissionRound.length > 0 ? (
                  <ul className="divide-y divide-current/15 border-y border-current/20">
                    {myPitchedBooksThisSubmissionRound.map((book) => {
                      const myPitchesOnBook = (pitchesByBook[book.id] ?? []).filter(
                        (entry) => entry.userId === currentUserId
                      )
                      const submittedBy = memberMap.get(book.createdByUserId)?.displayName ?? "Member"

                      return (
                        <li key={book.id} className="py-4">
                          <p>
                            <em>{book.title}</em> <span className="opacity-65">by {book.author}</span>
                          </p>
                          <p className="mt-0.5 text-[0.9em] opacity-55">
                            <span className="plate-data text-[0.88rem]">{book.lengthHours}</span> audiobook hours · Submitted by {submittedBy}
                          </p>
                          {myPitchesOnBook.map((pitchEntry) => (
                            <div key={pitchEntry.id} className="mt-3">
                              <p className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70">Your pitch</p>
                              <p className="mt-1 max-w-[35em]">{pitchEntry.pitch}</p>
                            </div>
                          ))}
                        </li>
                      )
                    })}
                  </ul>
                ) : null}
              </div>
            </section>

            {club.phase !== "voting" ? (
              <section>
                <Section>Submit book + pitch</Section>
                <p className="mt-3 opacity-65">
                  Submit for session <span className="plate-figures">{club.submissionRound}</span>. During reading, this becomes next session intake.
                </p>
                <div className="mt-4">
                  {mySubmissionForRound ? (
                    <div className="space-y-4">
                      <p className="opacity-65">
                        You already submitted for this session. Remove your submission before submitting again.
                      </p>
                      {(() => {
                        const submittedBook = booksById.get(mySubmissionForRound.bookId)
                        if (!submittedBook) {
                          return null
                        }

                        return (
                          <div className="border-y border-current/20 py-4">
                            <p>
                              <em>{submittedBook.title}</em>{" "}
                              <span className="opacity-65">by {submittedBook.author}</span>
                            </p>
                            <p className="plate-data mt-0.5 text-[0.88rem] opacity-55">
                              {submittedBook.lengthHours} audiobook hours
                            </p>
                            <p className="mt-3 max-w-[35em]">{mySubmissionForRound.pitch}</p>
                          </div>
                        )
                      })()}
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          void handleRemoveSubmission()
                        }}
                      >
                        Remove my submission
                      </Button>
                    </div>
                  ) : (
                    <>
                      <form className="space-y-5" onSubmit={handleSubmitPitch}>
                        <div className="grid gap-x-6 gap-y-4 md:grid-cols-3">
                          <Input
                            placeholder="Title"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                          />
                          <Input
                            placeholder="Author"
                            value={author}
                            onChange={(event) => setAuthor(event.target.value)}
                          />
                          <Input
                            placeholder="Length (audiobook hours)"
                            type="number"
                            min={0.25}
                            max={500}
                            step="0.25"
                            value={lengthHours}
                            onChange={(event) => setLengthHours(event.target.value)}
                          />
                        </div>
                        <Textarea
                          placeholder="Pitch this book to the club."
                          rows={4}
                          value={pitch}
                          onChange={(event) => setPitch(event.target.value)}
                        />
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="submit"
                            disabled={
                              busy ||
                              !title.trim() ||
                              !author.trim() ||
                              !lengthHours.trim() ||
                              !pitch.trim()
                            }
                          >
                            Submit pitch
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setTitle("")
                              setAuthor("")
                              setLengthHours("")
                              setPitch("")
                              setDuplicateBook(null)
                            }}
                          >
                            Start from scratch
                          </Button>
                        </div>
                      </form>

                      {duplicateBook ? (
                        <div className="mt-6 space-y-3 border-t border-current/20 pt-3">
                          <p>
                            This book already exists as <em>{duplicateBook.title}</em> by{" "}
                            {duplicateBook.author}.
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              onClick={() => {
                                void submitPitch(duplicateBook.id)
                              }}
                            >
                              Add my pitch to existing book
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setDuplicateBook(null)}
                            >
                              Enter a different book
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {club.phase === "reading" && currentUserPitches.length > 0 ? (
                        <div className="mt-8 space-y-3">
                          <p className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70">Resubmit a previous pitch</p>
                          <div className="flex flex-wrap gap-2">
                            {currentUserPitches.map((previousPitch) => {
                              const book = booksById.get(previousPitch.bookId)
                              if (!book) {
                                return null
                              }

                              return (
                                <Button
                                  key={previousPitch.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setTitle(book.title)
                                    setAuthor(book.author)
                                    setLengthHours(String(book.lengthHours))
                                    setPitch(previousPitch.pitch)
                                  }}
                                >
                                  Use {book.title}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              </section>
            ) : null}

            {club.phase === "voting" ? (
              <section>
                <Section>Ranked-choice voting</Section>
                <p className="mt-3 opacity-65">
                  Rank all books from most to least preferred. Votes are anonymous.
                </p>
                <div className="mt-4">
                  <p className="opacity-65">
                    <span className="plate-figures">{data.votesSubmittedCount}</span> of{" "}
                    <span className="plate-figures">{data.memberCount}</span> members have voted.
                  </p>
                  <ol className="mt-4 divide-y divide-current/15 border-y border-current/20">
                    {rankedBookIds.map((bookId, index) => {
                      const book = booksById.get(bookId)
                      if (!book) {
                        return null
                      }

                      return (
                        <li
                          key={bookId}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <p className="flex items-baseline gap-4">
                            <span className="plate-data w-6 text-right text-[0.94rem] opacity-55">
                              {index + 1}
                            </span>
                            <span>
                              <em>{book.title}</em> <span className="opacity-65">by {book.author}</span>
                            </span>
                          </p>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={index === 0}
                              onClick={() => moveRank(index, -1)}
                            >
                              Up
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={index === rankedBookIds.length - 1}
                              onClick={() => moveRank(index, 1)}
                            >
                              Down
                            </Button>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                  <Button
                    className="mt-5"
                    disabled={busy || rankedBookIds.length !== currentRoundBooks.length}
                    onClick={() => {
                      void handleVoteSubmit()
                    }}
                  >
                    Submit ranking
                  </Button>
                </div>
              </section>
            ) : null}

            {club.phase === "reading" ? (
              <section>
                <Section>Reading phase</Section>
                <p className="mt-3 opacity-65">Current winning book and meeting schedule.</p>
                <div className="mt-4 space-y-3">
                  {winningBook ? (
                    <p className="flex items-baseline gap-3">
                      <span className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70">Current book</span>
                      <span>
                        <em>{winningBook.title}</em> <span className="opacity-65">by {winningBook.author}</span>
                      </span>
                    </p>
                  ) : (
                    <p className="opacity-50">Winner not set yet.</p>
                  )}

                  <p className="flex items-baseline gap-3">
                    <span className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70">Meeting</span>
                    <span className="plate-data text-[1rem]">{formatDateTime(club.meetingAt)}</span>
                  </p>

                  {club.meetingAt ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href={buildGoogleCalendarLink(club.name, club.meetingAt)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          Add to Google Calendar
                        </Button>
                      </a>
                      <a href={`/api/projects/bookclub/${club.id}/meeting.ics`}>
                        <Button size="sm" variant="outline">
                          Download iCal
                        </Button>
                      </a>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {club.isOwner ? (
              <section>
                <Section>Owner controls</Section>
                <div className="mt-4 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {(club.phase === "submission" || club.phase === "reading") ? (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => {
                          void runTransition("start_voting")
                        }}
                      >
                        Start voting
                      </Button>
                    ) : null}

                    {club.phase === "voting" ? (
                      <>
                        <Button
                          disabled={busy}
                          onClick={() => {
                            void runTransition("end_voting")
                          }}
                        >
                          Close voting + reveal winner
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            void runTransition("reopen_submissions")
                          }}
                        >
                          Reopen submissions
                        </Button>
                      </>
                    ) : null}
                  </div>

                  {club.phase === "reading" ? (
                    <div className="space-y-3">
                      <p className="plate-label text-[0.8rem] uppercase tracking-[0.1em] opacity-70">Set meeting date</p>
                      <div className="flex flex-wrap items-end gap-4">
                        <Input
                          className="plate-data w-auto"
                          type="datetime-local"
                          value={meetingAtInput}
                          onChange={(event) => setMeetingAtInput(event.target.value)}
                        />
                        <Button
                          variant="outline"
                          disabled={busy || !meetingAtInput}
                          onClick={() => {
                            void setMeetingDate()
                          }}
                        >
                          Save date
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  )
}
