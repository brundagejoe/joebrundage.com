"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
  ArtSearchResponse,
  ArtSearchResult,
} from "@/shared/lib/art"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Link } from "@/shared/ui/link"

type SearchState =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: ArtSearchResponse | null; error: null }
  | { status: "success"; data: ArtSearchResponse; error: null }
  | { status: "error"; data: ArtSearchResponse | null; error: string }

function normalizeLetter(value: string): string {
  return value.trim().slice(0, 1).toUpperCase()
}

function isValidLetter(value: string): boolean {
  return /^[A-Z]$/.test(value)
}

function getLetterFromSearchParams(searchParams: URLSearchParams | null): string {
  if (!searchParams) {
    return ""
  }

  return normalizeLetter(searchParams.get("letter") ?? "")
}

function getMatchLabel(matchType: ArtSearchResult["matchType"]): string {
  return matchType === "title" ? "Title match" : "Artist match"
}

function ArtCard({ result }: { result: ArtSearchResult }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- Museum APIs return external image URLs and this tool does not yet configure Next image remote patterns. */}
        <img
          src={result.imageUrl}
          alt={`${result.title} by ${result.artistName}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{result.sourceLabel}</Badge>
          <Badge variant="secondary">{getMatchLabel(result.matchType)}</Badge>
          {result.isFallback ? <Badge variant="outline">Related</Badge> : null}
        </div>
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-base font-semibold leading-snug">
            {result.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {result.artistName}
          </p>
        </div>
        <Link href={result.sourceUrl} external className="text-sm font-medium">
          View online
        </Link>
      </div>
    </article>
  )
}

export function ArtClient() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [inputValue, setInputValue] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(null)
  const [searchState, setSearchState] = React.useState<SearchState>({
    status: "idle",
    data: null,
    error: null,
  })
  const [activeLetter, setActiveLetter] = React.useState("")
  const lastRequestedLetterRef = React.useRef("")

  const letterFromUrl = React.useMemo(
    () => getLetterFromSearchParams(searchParams),
    [searchParams]
  )

  const performSearch = React.useCallback(async (letter: string) => {
    setSearchState((current) => ({
      status: "loading",
      data: current.data,
      error: null,
    }))

    try {
      const response = await fetch(
        `/api/tools/art/search?letter=${encodeURIComponent(letter)}`
      )
      const payload = (await response.json()) as ArtSearchResponse & {
        error?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || "Could not load artwork results.")
      }

      setSearchState({
        status: "success",
        data: payload,
        error: null,
      })
      setActiveLetter(letter)
    } catch (error) {
      setSearchState((current) => ({
        status: "error",
        data: current.data,
        error:
          error instanceof Error
            ? error.message
            : "Could not load artwork results.",
      }))
    }
  }, [])

  React.useEffect(() => {
    if (letterFromUrl) {
      setInputValue(letterFromUrl)
      setValidationError(null)

      if (letterFromUrl !== lastRequestedLetterRef.current) {
        lastRequestedLetterRef.current = letterFromUrl
        void performSearch(letterFromUrl)
      }

      return
    }

    lastRequestedLetterRef.current = ""
    setActiveLetter("")
    setSearchState({
      status: "idle",
      data: null,
      error: null,
    })
  }, [letterFromUrl, performSearch])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedLetter = normalizeLetter(inputValue)
    if (!isValidLetter(normalizedLetter)) {
      setValidationError("Enter exactly one letter from A to Z.")
      return
    }

    setValidationError(null)
    const nextUrl = `${pathname}?letter=${encodeURIComponent(normalizedLetter)}`
    router.replace(nextUrl, { scroll: false })

    if (normalizedLetter === activeLetter) {
      lastRequestedLetterRef.current = normalizedLetter
      await performSearch(normalizedLetter)
    }
  }

  const handleClear = () => {
    setInputValue("")
    setValidationError(null)
    setActiveLetter("")
    lastRequestedLetterRef.current = ""
    setSearchState({
      status: "idle",
      data: null,
      error: null,
    })
    router.replace(pathname, { scroll: false })
  }

  const results = searchState.data?.results ?? []
  const fallbackResults = searchState.data?.fallbackResults ?? []

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card className="h-fit border-border/70">
            <CardHeader>
              <CardTitle className="text-2xl">Alphabetical Art Finder</CardTitle>
              <CardDescription>
                Enter one letter to find artworks whose title starts with it, or
                works by artists whose name starts with it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="art-letter">Letter</Label>
                  <Input
                    id="art-letter"
                    inputMode="text"
                    maxLength={1}
                    placeholder="A"
                    value={inputValue}
                    onChange={(event) => {
                      setInputValue(normalizeLetter(event.target.value))
                      if (validationError) {
                        setValidationError(null)
                      }
                    }}
                    aria-invalid={validationError ? "true" : "false"}
                  />
                  <p className="text-sm text-muted-foreground">
                    Try letters like <span className="font-medium text-foreground">M</span>,{" "}
                    <span className="font-medium text-foreground">S</span>, or{" "}
                    <span className="font-medium text-foreground">V</span>.
                  </p>
                </div>

                {validationError ? (
                  <p className="text-sm text-destructive">{validationError}</p>
                ) : null}

                <div className="flex gap-3">
                  <Button type="submit" disabled={searchState.status === "loading"}>
                    {searchState.status === "loading" ? "Searching..." : "Search"}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </form>

              <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 text-sm text-muted-foreground">
                Results come from The Met and the Art Institute of Chicago. Exact
                first-letter matches appear first, and related works are shown
                separately when exact matches are sparse.
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">Gallery</CardTitle>
                <CardDescription>
                  {activeLetter
                    ? `Showing results for the letter ${activeLetter}.`
                    : "Search for a letter to build a small museum gallery."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchState.status === "idle" ? (
                  <p className="text-sm text-muted-foreground">
                    Start with a single letter and this tool will pull up to 20
                    artwork matches with thumbnails and source links.
                  </p>
                ) : null}

                {searchState.status === "error" ? (
                  <p className="text-sm text-destructive">{searchState.error}</p>
                ) : null}

                {searchState.status === "loading" && results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Searching museum collections...
                  </p>
                ) : null}

                {searchState.status !== "idle" &&
                searchState.status !== "loading" &&
                results.length === 0 &&
                fallbackResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No matches with usable images turned up for {activeLetter}. Try
                    another letter.
                  </p>
                ) : null}

                {results.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold">Exact matches</h2>
                      <Badge variant="outline">
                        {searchState.data?.totalStrict ?? results.length} found
                      </Badge>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {results.map((result) => (
                        <ArtCard key={result.id} result={result} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {fallbackResults.length > 0 ? (
              <Card className="border-border/70">
                <CardHeader>
                  <CardTitle className="text-xl">More related works</CardTitle>
                  <CardDescription>
                    These do not start with {activeLetter} at the beginning, but
                    they still include a title word or artist word beginning with
                    that letter.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {fallbackResults.map((result) => (
                      <ArtCard key={result.id} result={result} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
