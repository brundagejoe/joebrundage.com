import type { LoaderFunctionArgs } from "@remix-run/node"
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
import { fetchAppleTVMovies } from "~/apple-tv/AppleTVAPIService.server"
import SimpleSearchBar from "~/UI/SimpleSearchBar"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get("q") || "Paul+Newman"
  const response = await fetchAppleTVMovies(query)
  return { movies: response.results }
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
            <a target="_blank" rel="noreferrer" href={movie.trackViewUrl}>
              <img
                src={getLargerSizeUrl(movie.artworkUrl100)}
                alt={movie.trackName}
                className="rounded-xl shadow-xl"
              />
            </a>
            <div>
              <p className="pr-2 font-semibold">{movie.trackName}</p>
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
