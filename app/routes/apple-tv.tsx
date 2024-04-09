import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
import { z } from "zod"
import AddMovieDialog from "~/apple-tv/AddMovieDialog"
import {
  queryAppleTVMovies,
  insertAppleTvRequest,
} from "~/apple-tv/AppleTVAPIService.server"
import SimpleSearchBar from "~/UI/SimpleSearchBar"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get("q") || "Paul+Newman"
  const response = await queryAppleTVMovies(query)
  return { movies: response.results }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formPayload = Object.fromEntries(await request.formData())
  const movieSchema = z.object({
    user_id: z.coerce.number(),
    track_id: z.coerce.number(),
    title: z.string(),
    price: z.coerce.number(),
  })

  const { user_id, track_id, title, price } = movieSchema.parse(formPayload)
  const error = await insertAppleTvRequest(user_id, track_id, title, price)
  if (error) throw new Error(error.message)
  return {}
}

export default function AppleTV() {
  const { movies } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const handleSearch = (newSearch: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set("q", newSearch)
    navigate(`?${newParams.toString()}`)
  }

  return (
    <div className="mx-4 mb-10 flex flex-col items-center gap-y-4">
      <div className="w-fit">
        <SimpleSearchBar
          defaultSearch={searchParams.get("q") || undefined}
          persistSearch
          onSearch={(v) => handleSearch(v)}
        />
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-6">
        {movies.map((movie) => (
          <div
            key={movie.trackName}
            className="flex w-[200px] flex-col items-start gap-y-1"
          >
            <AddMovieDialog
              //TODO: Add actual user ids, for now just always add it to Joe's account
              userId={1}
              movieTitle={movie.trackName}
              movieId={movie.trackId}
              moviePrice={movie.trackPrice}
            >
              <img
                src={getLargerSizeUrl(movie.artworkUrl100)}
                alt={movie.trackName}
                className="cursor-pointer rounded-xl shadow-xl"
              />
            </AddMovieDialog>
            <div>
              <a
                target="_blank"
                rel="noreferrer"
                href={movie.trackViewUrl}
                className="pr-2 font-semibold"
              >
                {movie.trackName}
              </a>
              {(movie.trackPrice || 0) > 0 && (
                <p className=" text-sm font-light">${movie.trackPrice}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getLargerSizeUrl = (url: string) => {
  return url.replace("100x100", "400x400")
}
