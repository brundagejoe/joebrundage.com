import {
  fetchAllAppleTvRequests,
  lookupAppleTVMovies,
} from "~/apple-tv/AppleTVAPIService.server"

export const loader = async () => {
  const movieRequests = await fetchAllAppleTvRequests()

  const ids =
    movieRequests?.flatMap((r) => r.apple_tv_requests).map((r) => r.track_id) ??
    []

  const fetchedMovies = await lookupAppleTVMovies(ids)

  const newPrices = fetchedMovies?.results.map((m) => {
    return {
      trackId: m.trackId,
      price: m.trackPrice,
    }
  })

  const validRequests = movieRequests?.map((r) => {
    return {
      ...r,
      apple_tv_requests: r.apple_tv_requests
        .map((r) => {
          return {
            ...r,
            old_price: (r.price || 0) / 100,
            new_price: newPrices?.find((p) => p.trackId === r.track_id)?.price,
          }
        })
        .filter((r) => r.new_price && r.new_price < r.old_price),
    }
  })

  // get the date in this format (3/24):
  const date = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  })

  const response = validRequests?.map((r) => {
    return {
      email: r.email,
      subject: `Apple TV watchlist movies (${date})`,
      message: `The following films are on sale:\n${r.apple_tv_requests.map((m) => `${m.title} (originally $${m.old_price} currently $${m.new_price})`).join("\n")}`,
    }
  })

  return response
}
