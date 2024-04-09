import { useFetcher } from "@remix-run/react"
import Dialog from "~/UI/Dialog"

export default function AddMovieDialog({
  userId,
  movieTitle,
  movieId,
  moviePrice,
  children,
}: {
  userId: number
  movieTitle: string
  movieId: number
  moviePrice: number | undefined
  children?: React.ReactNode
}) {
  const fetcher = useFetcher()

  const moviePriceCents = moviePrice ? Math.round(moviePrice * 100) : 0

  const handleSubmission = async () => {
    const formData = new FormData()

    formData.append("user_id", userId.toString())
    formData.append("track_id", movieId.toString())
    formData.append("title", movieTitle)
    formData.append("price", moviePriceCents.toString())

    fetcher.submit(formData, { method: "post", action: "/apple-tv" })
  }

  return (
    <Dialog
      title={`Add ${movieTitle} to your watchlist?`}
      onSubmit={handleSubmission}
      submitText="Add"
      Trigger={children}
      Content={
        <div>
          It's currently listed at ${moviePrice}. We'll email you when it goes
          on sale.
        </div>
      }
    />
  )
}
