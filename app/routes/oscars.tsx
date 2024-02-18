import type { ClientLoaderFunctionArgs } from "@remix-run/react"
import {
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "@remix-run/react"
import clsx from "clsx"
import SimpleSearchBar from "~/UI/SimpleSearchBar"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/shadcn-ui-components/ui/table"
import localForage from "localforage"
import socialImage from "../images/oscars-logo.jpeg"

type Nominee = {
  year_film: number
  year_ceremony: number
  ceremony: number
  category: string
  name: string
  film: string
  winner: boolean
}

export const meta = () => {
  return [
    { title: "Joe Brundage | Oscars Database" },
    {
      property: "og:image",
      content: `https://joebrundage.com${socialImage}`,
    },
  ]
}

export const clientLoader = async ({ request }: ClientLoaderFunctionArgs) => {
  const nominees = await getNomineesFromLocalForage()

  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get("q")
  const year = parseInt(searchParams.get("year") || "")
  const category = searchParams.get("category")

  if (year && category) {
    const data = getCategory(nominees, category, year)
    return { data }
  }

  if (!query) return { data: [] }

  const data = queryNominees(query, nominees)

  return { data }
}

const getCategory = (nominees: Nominee[], category: string, year: number) => {
  const categoryLower = category.toLowerCase()
  return nominees.filter(
    (nominee) =>
      nominee.category.toLowerCase() === categoryLower &&
      nominee.year_film === year,
  )
}

const queryNominees = (query: string, nominees: Nominee[]) => {
  const queryLower = query.toLowerCase()
  return nominees.filter(
    (nominee) =>
      nominee.name.toLowerCase().includes(queryLower) ||
      nominee.film.toLowerCase().includes(queryLower),
  )
}

const Oscars = () => {
  const { data } = useLoaderData<typeof clientLoader>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const containsSearch =
    searchParams.has("q") ||
    searchParams.has("year") ||
    searchParams.has("category")

  const handleSearch = (searchString: string) => {
    navigate(generateSearchLink(searchString))
  }

  const winnerCount = data.filter((nominee) => nominee.winner).length
  const nomineeCount = data.length

  const isMobile = window.innerWidth < 768

  return (
    <div className="mb-10 flex w-full flex-col items-center gap-y-4">
      <SimpleSearchBar
        placeholder={containsSearch ? "Search" : "Search a film or nominee"}
        onSearch={handleSearch}
      />
      <div className="flex flex-col gap-y-3">
        {isMobile &&
          (data.length !== 0 ? (
            data.map((nominee, index) => (
              <NomineeCard
                key={`nominee-${index}`}
                category={nominee.category}
                name={nominee.name}
                film={nominee.film}
                year={nominee.year_film}
                winner={nominee.winner}
              />
            ))
          ) : (
            <div className="mt-4 font-semibold text-gray-500">
              No results found
            </div>
          ))}
      </div>
      <div className="w-screen overflow-x-scroll md:w-fit">
        {!isMobile &&
          (data.length !== 0 ? (
            <Table className="box-border hidden max-w-[762px] px-4 md:table">
              <TableCaption>
                {winnerCount} wins / {nomineeCount} total nominations
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Year</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Film</TableHead>
                  <TableHead className="text-right">Winner?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((nominee, index) => {
                  return (
                    <TableRow
                      className={clsx({
                        "bg-green-100 hover:text-green-700": nominee.winner,
                      })}
                      key={`nominee-${index}`}
                    >
                      <TableCell className="font-medium">
                        {nominee.year_film}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={generateCategoryLink(
                            nominee.category,
                            nominee.year_film,
                          )}
                        >
                          {nominee.category}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={generateSearchLink(nominee.name)}>
                          {nominee.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to={generateSearchLink(nominee.film)}>
                          {nominee.film}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        {nominee.winner ? "Yes" : "No"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : containsSearch ? (
            <div className="mt-4 font-semibold text-gray-500">
              No results found
            </div>
          ) : (
            <></>
          ))}
      </div>
    </div>
  )
}

export default Oscars

const generateCategoryLink = (category: string, year: number) => {
  return `?year=${year}&category=${category}`
}
const generateSearchLink = (query: string) => {
  return `?q=${query}`
}

const getNomineesFromLocalForage = async (): Promise<Nominee[]> => {
  const cached = (await localForage.getItem("oscars")) as Nominee[]
  if (cached) {
    return cached
  }
  const response = await fetch("/oscars-awards.json")
  let data = await response.json()
  const content = data.content as Nominee[]
  localForage.setItem("oscars", content)
  return content as Nominee[]
}

const NomineeCard = ({
  category,
  name,
  film,
  year,
  winner,
}: {
  category: string
  name: string
  film: string
  year: number
  winner: boolean
}) => {
  return (
    <div
      className={clsx(
        "flex max-w-[380px] flex-col items-center rounded-xl p-5 text-center outline",
        winner ? "outline-3 outline-green-500" : "outline-1 outline-gray-200",
      )}
    >
      <p className="text-xs italic">{titleizeSentence(category)}</p>
      <p className="mt-1 text-2xl font-semibold uppercase">{name}</p>
      <p className="mt-1 text-xs font-semibold uppercase">{film}</p>
      <p className="mt-3 w-[200px] border-t-[1.5px] border-black pt-1 text-xs uppercase">
        {year}
      </p>
    </div>
  )
}

const titleizeSentence = (sentence: string) => {
  const excludedWords = ["in", "a"]

  return sentence.toLowerCase().replace(/\b\w+\b/g, (word) => {
    return excludedWords.includes(word.toLowerCase())
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1)
  })
}
