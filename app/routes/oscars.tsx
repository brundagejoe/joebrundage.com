import type { ClientLoaderFunctionArgs } from "@remix-run/react"
import { useLoaderData, useNavigate, useSearchParams } from "@remix-run/react"
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

type Nominee = {
  year_film: number
  year_ceremony: number
  ceremony: number
  category: string
  name: string
  film: string
  winner: boolean
}

const queryNominees = (query: string, nominees: Nominee[]) => {
  const queryLower = query.toLowerCase()
  return nominees.filter(
    (nominee) =>
      nominee.name.toLowerCase().includes(queryLower) ||
      nominee.film.toLowerCase().includes(queryLower),
  )
}

export const clientLoader = async ({ request }: ClientLoaderFunctionArgs) => {
  const nominees = await getNomineesFromLocalForage()

  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get("q")

  if (!query) return { data: [] }

  const data = queryNominees(query, nominees)

  return { data }
}

const Oscars = () => {
  const { data } = useLoaderData<typeof clientLoader>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const handleSearch = (searchString: string) => {
    const newSearchParams = new URLSearchParams(searchParams)
    newSearchParams.set("q", searchString)
    navigate(`?${newSearchParams.toString()}`)
  }

  const winnerCount = data.filter((nominee) => nominee.winner).length
  const nomineeCount = data.length

  return (
    <div className="mb-10 flex w-full flex-col items-center gap-y-4">
      <SimpleSearchBar onSearch={handleSearch} />
      <div>
        <Table className="max-w-[800px] px-4">
          <TableCaption>
            {winnerCount} wins / {nomineeCount} total nominations
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Year</TableHead>
              <TableHead>Cateogry</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Film</TableHead>
              <TableHead className="text-right">Winner?</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((nominee, index) => {
              return (
                <TableRow
                  className={clsx({ "bg-green-100": nominee.winner })}
                  key={`nominee-${index}`}
                >
                  <TableCell className="font-medium">
                    {nominee.year_film}
                  </TableCell>
                  <TableCell>{nominee.category}</TableCell>
                  <TableCell>{nominee.name}</TableCell>
                  <TableCell>{nominee.film}</TableCell>
                  <TableCell className="text-right">
                    {nominee.winner ? "Yes" : "No"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default Oscars

const getNomineesFromLocalForage = async (): Promise<Nominee[]> => {
  const cached = (await localForage.getItem("oscars")) as Nominee[]
  if (cached) {
    console.log("From cache!")
    return cached
  }
  const response = await fetch("/oscars-awards.json")
  let data = await response.json()
  const content = data.content as Nominee[]
  localForage.setItem("oscars", content)
  console.log("From fetch!")
  return content as Nominee[]
}
