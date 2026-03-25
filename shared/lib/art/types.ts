export type ArtMatchType = "title" | "artist"

export type ArtSearchResult = {
  id: string
  title: string
  artistName: string
  imageUrl: string
  sourceUrl: string
  sourceLabel: string
  matchType: ArtMatchType
  isFallback?: boolean
}

export type ArtSearchResponse = {
  letter: string
  results: ArtSearchResult[]
  fallbackResults: ArtSearchResult[]
  totalStrict: number
}
