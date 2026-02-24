"use client"

import * as React from "react"
import NextLink from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
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

type BookclubClubClientProps = {
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

export function BookclubClubClient({ clubId, isAuthed }: BookclubClubClientProps) {
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
        <section className="mx-auto max-w-3xl px-6 py-8">
          <Card>
            <CardContent className="space-y-3 py-3">
              <p className="text-sm text-muted-foreground">
                Log in to access this bookclub.
              </p>
              <NextLink href={`/login?next=/projects/bookclub/${clubId}`}>
                <Button>Log in</Button>
              </NextLink>
            </CardContent>
          </Card>
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
  const currentUserPitches = (data?.pitches ?? []).filter(
    (entry) => entry.userId === data.currentUserId
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
      <section className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {loading ? <p className="text-sm text-muted-foreground">Loading club...</p> : null}

        {data && club ? (
          <>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">{club.name}</h2>
              <p className="text-sm text-muted-foreground">
                Phase: {club.phase} • Round {club.currentRound}
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Card>
              <CardHeader>
                <CardTitle>Invite</CardTitle>
                <CardDescription>Share this link for others to join.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm break-all">
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
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Submissions</CardTitle>
                  <CardDescription>
                    Round {club.submissionRound} books and pitches.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(submissionRoundBooks.length === 0 && club.phase !== "voting") ? (
                    <p className="text-sm text-muted-foreground">No books submitted yet.</p>
                  ) : null}
                  {submissionRoundBooks.map((book) => (
                    <div key={book.id} className="rounded-md border border-border p-3 space-y-2">
                      <p className="font-medium">
                        {book.title} <span className="text-muted-foreground">by {book.author}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{book.lengthHours} audiobook hours</p>
                      <div className="space-y-2">
                        {(pitchesByBook[book.id] ?? []).map((pitchEntry) => (
                          <div key={pitchEntry.id} className="rounded-sm bg-muted/50 p-2">
                            <p className="text-xs text-muted-foreground">
                              {memberMap.get(pitchEntry.userId)?.displayName ?? "Member"}
                            </p>
                            <p className="text-sm">{pitchEntry.pitch}</p>
                          </div>
                        ))}
                      </div>
                      {club.phase === "voting" && club.isOwner ? (
                        <p className="text-xs text-muted-foreground">
                          Anonymous first-choice votes: {book.firstChoiceVotes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.members.map((member) => (
                    <p key={member.userId} className="text-sm">
                      {member.displayName}
                      <span className="text-xs text-muted-foreground">
                        {member.role === "owner" ? " (owner)" : ""}
                      </span>
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>

            {club.phase !== "voting" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Submit Book + Pitch</CardTitle>
                  <CardDescription>
                    Submit for round {club.submissionRound}. During reading, this becomes next round intake.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {mySubmissionForRound ? (
                    <p className="text-sm text-muted-foreground mb-3">
                      You already submitted for this round. Update the fields below to edit your submission.
                    </p>
                  ) : null}
                  <form className="space-y-3" onSubmit={handleSubmitPitch}>
                    <div className="grid gap-3 md:grid-cols-3">
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
                    <div className="mt-3 rounded-md border border-border bg-muted/50 p-3 space-y-2">
                      <p className="text-sm">
                        This book already exists as <strong>{duplicateBook.title}</strong> by{" "}
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
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Resubmit a previous pitch</p>
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
                </CardContent>
              </Card>
            ) : null}

            {club.phase === "voting" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Ranked-Choice Voting</CardTitle>
                  <CardDescription>
                    Rank all books from most to least preferred. Votes are anonymous.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {data.votesSubmittedCount} of {data.memberCount} members have voted.
                  </p>
                  {rankedBookIds.map((bookId, index) => {
                    const book = booksById.get(bookId)
                    if (!book) {
                      return null
                    }

                    return (
                      <div
                        key={bookId}
                        className="rounded-md border border-border p-2 flex items-center justify-between gap-3"
                      >
                        <p className="text-sm">
                          #{index + 1} {book.title} by {book.author}
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
                      </div>
                    )
                  })}
                  <Button
                    disabled={busy || rankedBookIds.length !== currentRoundBooks.length}
                    onClick={() => {
                      void handleVoteSubmit()
                    }}
                  >
                    Submit ranking
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {club.phase === "reading" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Reading Phase</CardTitle>
                  <CardDescription>Current winning book and meeting schedule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {winningBook ? (
                    <p className="text-sm">
                      Current book: <strong>{winningBook.title}</strong> by {winningBook.author}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Winner not set yet.</p>
                  )}

                  <p className="text-sm">Meeting date: {formatDateTime(club.meetingAt)}</p>

                  {club.meetingAt ? (
                    <div className="flex gap-2 flex-wrap">
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
                </CardContent>
              </Card>
            ) : null}

            {club.isOwner ? (
              <Card>
                <CardHeader>
                  <CardTitle>Owner Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Set meeting date</p>
                      <div className="flex gap-2 flex-wrap">
                        <Input
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
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </section>
    </div>
  )
}
