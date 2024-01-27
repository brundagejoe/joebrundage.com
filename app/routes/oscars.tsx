import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import {
  ClientLoaderFunctionArgs,
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
import { getJsonContent } from "~/utils/content.server"

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const response = await getJsonContent("oscars-awards")
  if (!response.success) throw new Error("Failed to fetch data")
  const allNominees = JSON.parse(response.content) as Nominee[]

  const searchParams = new URL(request.url).searchParams
  const query = searchParams.get("q")

  const data = query ? queryNominees(query, allNominees) : []

  return json({ data })
}

export const clientLoader = async ({
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  const data = await serverLoader()
  return data
}

const Oscars = () => {
  const { data } = useLoaderData<typeof loader>()
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
