import type { QueryData } from "@supabase/supabase-js"
import { z } from "zod"
import { supabase } from "~/supabase/supabase.server"

export const queryAppleTVMovies = async (searchTerm: string) => {
  const response = await fetch(
    `https://itunes.apple.com/search?media=movie&term=${searchTerm}`,
  )

  const data = await response.json()
  return AppleTVSearchResponse.parse(data)
}

export const lookupAppleTVMovies = async (ids: number[]) => {
  const response = await fetch(
    `https://itunes.apple.com/lookup?id=${ids.join(",")}`,
  )

  const data = await response.json()
  return AppleTVSearchResponse.parse(data)
}

const AppleTVSearchResponse = z.object({
  resultCount: z.number(),
  results: z.array(
    z.object({
      trackName: z.string(),
      trackId: z.number(),
      artworkUrl100: z.string(),
      trackPrice: z.number().optional(),
      hasITunesExtras: z.boolean().optional(),
      longDescription: z.string().optional(),
      trackTimeMillis: z.number().optional(),
      trackViewUrl: z.string().optional(),
    }),
  ),
})

export const insertAppleTvRequest = async (
  userId: number,
  movieId: number,
  title: string,
  price: number,
) => {
  let { error } = await supabase.from("apple_tv_requests").insert([
    {
      track_id: movieId,
      title: title,
      user_id: userId,
      price,
    },
  ])

  return error
}

export const fetchAllAppleTvRequests = async () => {
  let usersAndRequestsQuery = supabase.from("users").select(`
    email,
    apple_tv_requests(title, track_id, price)
  `)

  type UsersAndRequests = QueryData<typeof usersAndRequestsQuery>

  const { data, error } = await usersAndRequestsQuery
  if (error || !data) return

  const usersAndRequests: UsersAndRequests = data
  return usersAndRequests
}
