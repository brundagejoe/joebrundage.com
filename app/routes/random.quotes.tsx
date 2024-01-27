import { PlusCircleIcon, XCircleIcon } from "@heroicons/react/24/outline"
import type { ActionArgs, LoaderArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import type { FetcherWithComponents } from "@remix-run/react"
import {
  useLoaderData,
  Form,
  useNavigation,
  useFetcher,
} from "@remix-run/react"
import BodyContainer from "~/UI/BodyContainer"
import { Button } from "~/shadcn-ui-components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/shadcn-ui-components/ui/dialog"
import { Input } from "~/shadcn-ui-components/ui/input"
import { Label } from "~/shadcn-ui-components/ui/label"
import { Textarea } from "~/shadcn-ui-components/ui/textarea"
import { deleteQuote, fetchQuotes, insertQuote } from "~/supabase/quotes.server"
import { getUserId } from "~/utils/session.server"
import { z } from "zod"
import clsx from "clsx"

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request)

  return json({
    userId,
    quotes: await fetchQuotes(),
  })
}

export const action = async ({ request }: ActionArgs) => {
  const { _action, ...formPayload } = Object.fromEntries(
    await request.formData(),
  )

  switch (_action) {
    case "addQuote":
      const quoteSchema = z.object({
        quote: z.string().min(1),
        author: z.string().min(1),
        date: z.string().min(1),
        associated_user_id: z.coerce.number(),
        note: z.string(),
      })

      try {
        const quote = quoteSchema.parse(formPayload)
        const error = await insertQuote(quote)
        if (error) throw new Error(error.message)
        return json({ success: true })
      } catch (e) {
        console.log(e)
        return json({ success: false })
      }
    case "deleteQuote":
      try {
        const error = await deleteQuote(
          parseInt(formPayload.quote_id as string),
        )
        if (error) throw new Error(error.message)
        return json({ success: true })
      } catch (e) {
        console.log(e)
        return json({ success: false })
      }

    default:
      return json({ success: false })
  }
}

export default function Blog() {
  const { userId, quotes } = useLoaderData<typeof loader>()
  const navigation = useNavigation()
  const isAdding =
    navigation.formData && navigation.formData.get("_action") === "addQuote"

  return (
    <div className="mb-10 font-semibold">
      <BodyContainer serif>
        <h2 className="mb-4 text-3xl">Quotes</h2>
        {quotes?.map((quote) => {
          return (
            <Quote
              userId={userId}
              id={quote.id}
              key={quote.id}
              quote={quote.quote}
              author={quote.author}
              date={quote.date}
            />
          )
        })}
        {isAdding && (
          <Quote
            quote={navigation.formData?.get("quote") as string}
            author={navigation.formData?.get("author") as string}
            date={navigation.formData?.get("date") as string}
          />
        )}
        {userId && (
          <div className="flex w-full justify-center">
            <AddQuoteDialog userId={userId} />
          </div>
        )}
      </BodyContainer>
    </div>
  )
}

const Quote = ({
  id,
  quote,
  author,
  date,
  userId,
}: {
  id?: number
  quote: string
  author: string
  date: string
  userId?: number
}) => {
  const fetcher = useFetcher()
  const isDeleting =
    fetcher.formData &&
    fetcher.formData.get("_action") === "deleteQuote" &&
    parseInt(fetcher.formData.get("quote_id") as string) === id

  return (
    <div
      className={clsx(
        "group relative pb-2 pt-6",
        isDeleting ? "hidden" : "block",
      )}
    >
      {userId && id && (
        <div className="absolute right-0 top-0 hidden group-hover:flex">
          <DeleteDialog fetcher={fetcher} quoteId={id} />
        </div>
      )}
      <p className="text-xl font-semibold">{quote}</p>
      <p className="text-md font-semibold">
        {author} ({date})
      </p>
    </div>
  )
}

const DeleteDialog = ({
  quoteId,
  fetcher,
}: {
  quoteId: number
  fetcher: FetcherWithComponents<any>
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <XCircleIcon className="h-6 w-6 cursor-pointer rounded-full transition-all hover:scale-125" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <fetcher.Form method="POST">
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this quote?
            </DialogTitle>
          </DialogHeader>
          <input type="hidden" id="quote_id" name="quote_id" value={quoteId} />
          <DialogFooter>
            <DialogClose asChild>
              <Button
                className="mt-4 w-full"
                type="submit"
                name="_action"
                value="deleteQuote"
              >
                Yes
              </Button>
            </DialogClose>
          </DialogFooter>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  )
}

const AddQuoteDialog = ({ userId }: { userId: number }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <PlusCircleIcon className="h-8 w-8 rounded-full transition-all hover:scale-125" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form method="POST">
          <DialogHeader>
            <DialogTitle>Add a quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="quote" className="pt-1 text-right">
                Quote
              </Label>
              <Textarea className="col-span-3" id="quote" name="quote" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="author" className="text-right">
                Author
              </Label>
              <Input className="col-span-3" id="author" name="author" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" name="date" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="note" className="pt-1 text-right">
                Notes
              </Label>
              <Textarea className="col-span-3" id="note" name="note" />
            </div>
          </div>
          <input
            type="hidden"
            id="associated_user_id"
            name="associated_user_id"
            value={userId}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="submit" name="_action" value="addQuote">
                Submit
              </Button>
            </DialogClose>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
