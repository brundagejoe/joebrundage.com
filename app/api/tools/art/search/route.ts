import { NextRequest, NextResponse } from "next/server"
import type {
  ArtMatchType,
  ArtSearchResponse,
  ArtSearchResult,
} from "@/shared/lib/art"

const MAX_RESULTS = 20
const MET_OBJECT_LIMIT = 18
const ARTIC_SEARCH_LIMIT = 40
const REQUEST_TIMEOUT_MS = 10_000

const MET_SEARCH_URL = "https://collectionapi.metmuseum.org/public/collection/v1/search"
const MET_OBJECT_URL = "https://collectionapi.metmuseum.org/public/collection/v1/objects"
const ARTIC_SEARCH_URL = "https://api.artic.edu/api/v1/artworks/search"
const ARTIC_IMAGE_BASE_URL = "https://www.artic.edu/iiif/2"

type MetSearchResponse = {
  objectIDs?: number[] | null
}

type MetObjectResponse = {
  objectID?: number
  title?: string | null
  artistDisplayName?: string | null
  primaryImageSmall?: string | null
  primaryImage?: string | null
  objectURL?: string | null
}

type ArticSearchResponse = {
  data?: ArticArtworkRecord[] | null
}

type ArticArtworkRecord = {
  id?: number
  title?: string | null
  artist_title?: string | null
  image_id?: string | null
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null
}

function withTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const { signal, cleanup } = withTimeoutSignal(REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Upstream request failed with status ${response.status}.`)
    }

    return (await response.json()) as T
  } finally {
    cleanup()
  }
}

function normalizeLetter(rawLetter: string | null): string | null {
  if (!rawLetter) {
    return null
  }

  const trimmed = rawLetter.trim()
  if (!/^[a-zA-Z]$/.test(trimmed)) {
    return null
  }

  return trimmed.toUpperCase()
}

function normalizeMatchTarget(value: string): string {
  return value.trim().replace(/^[^A-Za-z]+/, "").toUpperCase()
}

function startsWithLetter(value: string, letter: string): boolean {
  return normalizeMatchTarget(value).startsWith(letter)
}

function hasWordStartingWithLetter(value: string, letter: string): boolean {
  return value
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean)
    .some((word) => word.startsWith(letter))
}

function getStrictMatchType(result: ArtSearchResult, letter: string): ArtMatchType | null {
  if (startsWithLetter(result.title, letter)) {
    return "title"
  }

  if (startsWithLetter(result.artistName, letter)) {
    return "artist"
  }

  return null
}

function getFallbackMatchType(
  result: ArtSearchResult,
  letter: string
): ArtMatchType | null {
  if (hasWordStartingWithLetter(result.title, letter)) {
    return "title"
  }

  if (hasWordStartingWithLetter(result.artistName, letter)) {
    return "artist"
  }

  return null
}

function dedupeResults(results: ArtSearchResult[]): ArtSearchResult[] {
  const seen = new Set<string>()
  const deduped: ArtSearchResult[] = []

  for (const result of results) {
    const key = result.sourceUrl.trim()
      ? result.sourceUrl
      : `${result.title.toUpperCase()}::${result.artistName.toUpperCase()}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(result)
  }

  return deduped
}

function scoreResult(result: ArtSearchResult): number {
  return result.matchType === "title" ? 0 : 1
}

function sortResults(results: ArtSearchResult[]): ArtSearchResult[] {
  return [...results].sort((left, right) => {
    const scoreDiff = scoreResult(left) - scoreResult(right)
    if (scoreDiff !== 0) {
      return scoreDiff
    }

    const titleDiff = left.title.localeCompare(right.title)
    if (titleDiff !== 0) {
      return titleDiff
    }

    return left.artistName.localeCompare(right.artistName)
  })
}

function buildMetSourceUrl(objectId: number, objectUrl?: string | null): string {
  if (objectUrl && objectUrl.trim().length > 0) {
    return objectUrl
  }

  return `https://www.metmuseum.org/art/collection/search/${objectId}`
}

function buildArticImageUrl(imageId: string): string {
  return `${ARTIC_IMAGE_BASE_URL}/${imageId}/full/843,/0/default.jpg`
}

function normalizeMetObject(data: MetObjectResponse): ArtSearchResult | null {
  const objectId = data.objectID
  const title = data.title?.trim()
  const artistName = data.artistDisplayName?.trim() || "Unknown artist"
  const imageUrl = data.primaryImageSmall?.trim() || data.primaryImage?.trim()

  if (!objectId || !title || !imageUrl) {
    return null
  }

  return {
    id: `met-${objectId}`,
    title,
    artistName,
    imageUrl,
    sourceUrl: buildMetSourceUrl(objectId, data.objectURL),
    sourceLabel: "The Met",
    matchType: "title",
  }
}

function normalizeArticRecord(data: ArticArtworkRecord): ArtSearchResult | null {
  const id = data.id
  const title = data.title?.trim()
  const imageId = data.image_id?.trim()

  if (!id || !title || !imageId) {
    return null
  }

  return {
    id: `artic-${id}`,
    title,
    artistName: data.artist_title?.trim() || "Unknown artist",
    imageUrl: buildArticImageUrl(imageId),
    sourceUrl: `https://www.artic.edu/artworks/${id}`,
    sourceLabel: "Art Institute of Chicago",
    matchType: "title",
  }
}

async function fetchMetObjectIds(letter: string, mode: "title" | "artist") {
  const url = new URL(MET_SEARCH_URL)
  url.searchParams.set("q", letter)
  url.searchParams.set("hasImages", "true")
  url.searchParams.set(mode === "title" ? "title" : "artistOrCulture", "true")

  const payload = await fetchJson<MetSearchResponse>(url.toString())
  return (payload.objectIDs ?? []).slice(0, MET_OBJECT_LIMIT)
}

async function fetchMetObjects(letter: string): Promise<ArtSearchResult[]> {
  const [titleIds, artistIds] = await Promise.all([
    fetchMetObjectIds(letter, "title"),
    fetchMetObjectIds(letter, "artist"),
  ])

  const objectIds = [...new Set([...titleIds, ...artistIds])]
  const objects = await Promise.all(
    objectIds.map(async (objectId) => {
      try {
        const payload = await fetchJson<MetObjectResponse>(
          `${MET_OBJECT_URL}/${objectId}`
        )
        return normalizeMetObject(payload)
      } catch {
        return null
      }
    })
  )

  return objects.filter((result): result is ArtSearchResult => result !== null)
}

async function fetchArticObjects(letter: string): Promise<ArtSearchResult[]> {
  const url = new URL(ARTIC_SEARCH_URL)
  url.searchParams.set("q", letter)
  url.searchParams.set("limit", String(ARTIC_SEARCH_LIMIT))
  url.searchParams.set(
    "fields",
    "id,title,artist_title,image_id"
  )

  const payload = await fetchJson<ArticSearchResponse>(url.toString())
  return (payload.data ?? [])
    .map(normalizeArticRecord)
    .filter((result): result is ArtSearchResult => result !== null)
}

function buildResponse(letter: string, candidates: ArtSearchResult[]): ArtSearchResponse {
  const dedupedCandidates = dedupeResults(candidates)

  const allStrictResults = sortResults(
    dedupedCandidates
      .map((candidate) => {
        const matchType = getStrictMatchType(candidate, letter)
        if (!matchType) {
          return null
        }

        return {
          ...candidate,
          matchType,
        }
      })
      .filter(isNonNullable)
  )

  const strictResults = allStrictResults.slice(0, MAX_RESULTS)

  const remainingSlots = Math.max(0, MAX_RESULTS - strictResults.length)
  const strictIds = new Set(strictResults.map((result) => result.id))

  const fallbackResults =
    remainingSlots > 0
      ? sortResults(
          dedupedCandidates
            .filter((candidate) => !strictIds.has(candidate.id))
            .map((candidate) => {
              const matchType = getFallbackMatchType(candidate, letter)
              if (!matchType) {
                return null
              }

              return {
                ...candidate,
                matchType,
                isFallback: true,
              }
            })
            .filter(isNonNullable)
        ).slice(0, remainingSlots)
      : []

  return {
    letter,
    results: strictResults,
    fallbackResults,
    totalStrict: allStrictResults.length,
  }
}

export async function GET(request: NextRequest) {
  const letter = normalizeLetter(request.nextUrl.searchParams.get("letter"))

  if (!letter) {
    return NextResponse.json(
      { error: "The letter parameter must be exactly one alphabetic character." },
      { status: 400 }
    )
  }

  try {
    const [metResults, articResults] = await Promise.all([
      fetchMetObjects(letter),
      fetchArticObjects(letter),
    ])

    return NextResponse.json(buildResponse(letter, [...metResults, ...articResults]))
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown upstream error while searching museum collections."

    return NextResponse.json(
      { error: `Could not search artwork right now. ${message}` },
      { status: 502 }
    )
  }
}
