"use client"

import * as React from "react"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"

type BookclubListItem = {
  id: string
  name: string
  inviteCode: string
  phase: "submission" | "voting" | "reading"
  currentRound: number
  isOwner: boolean
}

type BookclubHomeClientProps = {
  isAuthed: boolean
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const data = (await response.json()) as T & { error?: string }

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed")
  }

  return data
}

export function BookclubHomeClient({ isAuthed }: BookclubHomeClientProps) {
  const router = useRouter()
  const [clubs, setClubs] = React.useState<BookclubListItem[]>([])
  const [loading, setLoading] = React.useState(isAuthed)
  const [error, setError] = React.useState<string | null>(null)
  const [createName, setCreateName] = React.useState("")
  const [joinCode, setJoinCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const loadClubs = React.useCallback(async () => {
    if (!isAuthed) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await requestJson<{ clubs: BookclubListItem[] }>(
        "/api/projects/bookclub"
      )
      setClubs(data.clubs)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load clubs.")
    } finally {
      setLoading(false)
    }
  }, [isAuthed])

  React.useEffect(() => {
    void loadClubs()
  }, [loadClubs])

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createName.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const data = await requestJson<{ clubId: string }>(
        "/api/projects/bookclub/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: createName.trim() }),
        }
      )

      router.push(`/projects/bookclub/${data.clubId}`)
    } catch (createError) {
      setError(
        createError instanceof Error ? createError.message : "Could not create bookclub."
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!joinCode.trim()) {
      return
    }

    setSubmitting(true)
    try {
      const data = await requestJson<{ clubId: string }>("/api/projects/bookclub/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode.trim() }),
      })

      router.push(`/projects/bookclub/${data.clubId}`)
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join bookclub.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Bookclub</h2>
          <p className="text-muted-foreground">
            Create a club, share a join link, submit pitches, and run ranked-choice voting.
          </p>
        </div>

        {!isAuthed ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You need an account to create or join a bookclub.
            </p>
            <div className="flex gap-3">
              <NextLink href="/login?next=/projects/bookclub">
                <Button>Log in</Button>
              </NextLink>
              <NextLink href="/signup?next=/projects/bookclub">
                <Button variant="outline">Sign up</Button>
              </NextLink>
            </div>
          </div>
        ) : null}

        {isAuthed ? (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Create a Club</h3>
              <p className="text-sm text-muted-foreground">Start a new bookclub and invite others.</p>
              <div>
                <form className="space-y-3" onSubmit={handleCreate}>
                  <Input
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="Downtown Sci-Fi Club"
                    maxLength={80}
                  />
                  <Button
                    type="submit"
                    disabled={submitting || createName.trim().length < 2}
                  >
                    Create bookclub
                  </Button>
                </form>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Join by Invite</h3>
              <p className="text-sm text-muted-foreground">Paste an invite code from a share link.</p>
              <div>
                <form className="space-y-3" onSubmit={handleJoin}>
                  <Input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="Invite code"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={submitting || !joinCode.trim()}
                  >
                    Join bookclub
                  </Button>
                </form>
              </div>
            </section>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Your Bookclubs</h3>
          <p className="text-sm text-muted-foreground">
            Open any club to submit, vote, or manage sessions.
          </p>
          <div className="space-y-3">
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
            {!loading && clubs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookclubs yet.</p>
            ) : null}
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-medium">{club.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Session {club.currentRound} • {club.phase}
                    {club.isOwner ? " • owner" : ""}
                  </p>
                </div>
                <NextLink href={`/projects/bookclub/${club.id}`}>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </NextLink>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
