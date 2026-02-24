"use client"

import * as React from "react"
import NextLink from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/ui/button"

type BookclubJoinClientProps = {
  inviteCode: string
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

export function BookclubJoinClient({ inviteCode, isAuthed }: BookclubJoinClientProps) {
  const router = useRouter()
  const [status, setStatus] = React.useState<"idle" | "joining" | "error">("idle")
  const [error, setError] = React.useState<string | null>(null)

  const joinClub = React.useCallback(async () => {
    setStatus("joining")
    try {
      const data = await requestJson<{ clubId: string }>("/api/projects/bookclub/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      })
      router.replace(`/projects/bookclub/${data.clubId}`)
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "Could not join club.")
      setStatus("error")
    }
  }, [inviteCode, router])

  React.useEffect(() => {
    if (isAuthed) {
      void joinClub()
    }
  }, [isAuthed, joinClub])

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-xl px-6 py-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Join Bookclub</h2>
          {!isAuthed ? (
            <>
              <p className="text-sm text-muted-foreground">
                Log in first to accept this invite.
              </p>
              <NextLink href={`/login?next=/projects/bookclub/join/${inviteCode}`}>
                <Button>Log in</Button>
              </NextLink>
            </>
          ) : null}
          {isAuthed && status === "joining" ? (
            <p className="text-sm text-muted-foreground">Joining bookclub...</p>
          ) : null}
          {status === "error" ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </section>
    </div>
  )
}
