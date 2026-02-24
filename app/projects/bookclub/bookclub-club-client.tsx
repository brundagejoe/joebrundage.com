"use client"

import * as React from "react"
import NextLink from "next/link"
import { Button } from "@/shared/ui/button"

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

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed")
  }

  return data
}

export function BookclubClubClient({ clubId, isAuthed }: BookclubClubClientProps) {
  const [data, setData] = React.useState<ClubResponse | null>(null)
  const [loading, setLoading] = React.useState(isAuthed)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      if (!isAuthed) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const clubData = await requestJson<ClubResponse>(`/api/projects/bookclub/${clubId}`)
        setData(clubData)
        setError(null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load bookclub.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [clubId, isAuthed])

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <section className="mx-auto max-w-3xl px-6 py-8">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Log in to access this bookclub.</p>
            <NextLink href={`/login?next=/projects/bookclub/${clubId}`}>
              <Button>Log in</Button>
            </NextLink>
          </div>
        </section>
      </div>
    )
  }

  const club = data?.club
  const booksById = new Map((data?.books ?? []).map((book) => [book.id, book]))
  const memberMap = new Map((data?.members ?? []).map((member) => [member.userId, member]))
  const winningBook = club?.activeBookId ? booksById.get(club.activeBookId) : null
  const upcomingSubmissions = (data?.books ?? []).filter(
    (book) => book.roundNumber === (club?.submissionRound ?? 0)
  )
  const pitchesByBook = (data?.pitches ?? []).reduce<Record<string, ClubResponse["pitches"]>>(
    (acc, pitchEntry) => {
      const existing = acc[pitchEntry.bookId] ?? []
      existing.push(pitchEntry)
      acc[pitchEntry.bookId] = existing
      return acc
    },
    {}
  )

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {loading && !data ? (
          <>
            <div className="h-12 rounded-md bg-muted/40" />
            <div className="h-44 rounded-md bg-muted/40" />
            <div className="h-56 rounded-md bg-muted/40" />
          </>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {club ? (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-2xl font-semibold">{club.name}</h2>
                <p className="text-sm text-muted-foreground">Bookclub session #{club.currentRound}</p>
              </div>
              <NextLink href={`/projects/bookclub/${clubId}/edit`}>
                <Button>Edit My Content</Button>
              </NextLink>
            </div>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Current Book</h3>
              <p className="text-sm text-muted-foreground">Winner from the current session, if selected.</p>
              <div>
                {winningBook ? (
                  <div className="space-y-1">
                    <p className="font-medium">{winningBook.title}</p>
                    <p className="text-sm text-muted-foreground">
                      by {winningBook.author} • {winningBook.lengthHours} audiobook hours
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Meeting: {formatDateTime(club.meetingAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No winning book yet.</p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Next Session Submissions</h3>
              <p className="text-sm text-muted-foreground">
                Submissions so far for session #{club.submissionRound}.
              </p>
              <div className="space-y-3">
                {upcomingSubmissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No submissions yet.</p>
                ) : null}
                {upcomingSubmissions.map((book) => (
                  <div key={book.id} className="space-y-2">
                    <p className="font-medium">
                      {book.title} <span className="text-muted-foreground">by {book.author}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{book.lengthHours} audiobook hours</p>
                    {(pitchesByBook[book.id] ?? []).map((pitchEntry) => (
                      <div key={pitchEntry.id} className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {memberMap.get(pitchEntry.userId)?.displayName ?? "Member"}
                        </p>
                        <p className="text-sm">{pitchEntry.pitch}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Members</h3>
              <div className="space-y-2">
                {data.members.map((member) => (
                  <p key={member.userId} className="text-sm">
                    {member.displayName}
                    <span className="text-xs text-muted-foreground">
                      {member.role === "owner" ? " (owner)" : ""}
                    </span>
                  </p>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </div>
  )
}
