import { z } from "zod"

export const fetchAppleTVMovies = async (searchTerm: string) => {
  const response = await fetch(
    `https://itunes.apple.com/search?media=movie&term=${searchTerm}`,
  )

  const data = await response.json()
  return AppleTVSearchResponse.parse(data)
}

const AppleTVSearchResponse = z.object({
  resultCount: z.number(),
  results: z.array(
    z.object({
      trackName: z.string(),
      artworkUrl100: z.string(),
      trackPrice: z.number().optional(),
      hasITunesExtras: z.boolean().optional(),
      longDescription: z.string().optional(),
      trackTimeMillis: z.number().optional(),
      trackViewUrl: z.string().optional(),
    }),
  ),
})
