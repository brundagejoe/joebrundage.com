"use client"

import * as React from "react"
import NextLink from "next/link"
import { Button } from "@/shared/ui/button"
import { Section } from "@/shared/ui/plate"

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
        <section className="mx-auto max-w-3xl px-6 py-10">
          <p className="opacity-65">Log in to access this bookclub.</p>
          <NextLink
            className="mt-4 inline-block"
            href={`/login?next=/projects/bookclub/${clubId}`}
          >
            <Button>Log in</Button>
          </NextLink>
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
      <section className="mx-auto max-w-4xl px-6 py-10">
        {loading && !data ? <p className="opacity-50">Loading...</p> : null}
        {error ? <p className="text-[0.84rem] text-destructive">{error}</p> : null}

        {club ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-[2.4rem] leading-tight">{club.name}</h1>
                <p className="plate-label mt-2 text-[0.66rem] uppercase tracking-[0.12em] opacity-55">
                  Session <span className="plate-data">{club.currentRound}</span>
                </p>
              </div>
              <NextLink href={`/projects/bookclub/${clubId}/edit`}>
                <Button>Edit My Content</Button>
              </NextLink>
            </div>

            <section>
              <Section>Current book</Section>
              <p className="mt-3 opacity-65">Winner from the current session, if selected.</p>
              <div className="mt-4">
                {winningBook ? (
                  <>
                    <p className="text-[1.5rem] leading-snug">{winningBook.title}</p>
                    <p className="mt-1 opacity-70">
                      by {winningBook.author} · <span className="plate-figures">{winningBook.lengthHours}</span> audiobook hours
                    </p>
                    <p className="mt-3 flex items-baseline gap-3">
                      <span className="plate-label text-[0.66rem] uppercase tracking-[0.12em] opacity-55">
                        Meeting
                      </span>
                      <span className="plate-data text-[0.9rem]">{formatDateTime(club.meetingAt)}</span>
                    </p>
                  </>
                ) : (
                  <p className="opacity-50">No winning book yet.</p>
                )}
              </div>
            </section>

            <section>
              <Section>Next session submissions</Section>
              <p className="mt-3 opacity-65">
                Submissions so far for session <span className="plate-figures">{club.submissionRound}</span>.
              </p>
              <div className="mt-4">
                {upcomingSubmissions.length === 0 ? (
                  <p className="opacity-50">No submissions yet.</p>
                ) : (
                  <ul className="divide-y divide-current/15 border-y border-current/20">
                    {upcomingSubmissions.map((book) => (
                      <li key={book.id} className="py-4">
                        <p>
                          <em>{book.title}</em> <span className="opacity-65">by {book.author}</span>
                        </p>
                        <p className="plate-data mt-0.5 text-[0.8rem] opacity-55">
                          {book.lengthHours} audiobook hours
                        </p>
                        {(pitchesByBook[book.id] ?? []).map((pitchEntry) => (
                          <div key={pitchEntry.id} className="mt-3">
                            <p className="plate-label text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                              {memberMap.get(pitchEntry.userId)?.displayName ?? "Member"}
                            </p>
                            <p className="mt-1 max-w-[38rem]">{pitchEntry.pitch}</p>
                          </div>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section>
              <Section>Members</Section>
              <ul className="mt-4 divide-y divide-current/15 border-y border-current/20">
                {data.members.map((member) => (
                  <li key={member.userId} className="flex items-baseline justify-between gap-3 py-2">
                    <span>{member.displayName}</span>
                    {member.role === "owner" ? (
                      <span className="plate-label text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                        owner
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}
      </section>
    </div>
  )
}
