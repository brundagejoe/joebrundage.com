import { PlusCircleIcon } from "@heroicons/react/24/outline";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import BodyContainer from "~/UI/BodyContainer";
import MenuBar from "~/UI/Menubar";
import { Button } from "~/shadcn-ui-components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/shadcn-ui-components/ui/dialog";
import { Input } from "~/shadcn-ui-components/ui/input";
import { Label } from "~/shadcn-ui-components/ui/label";
import { Textarea } from "~/shadcn-ui-components/ui/textarea";
import { fetchQuotes, insertQuote } from "~/supabase/quotes.server";
import { getUserId } from "~/utils/session.server";
import { z } from "zod";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);

  return json({
    userId,
    quotes: await fetchQuotes(),
  });
};

export const action = async ({ request }: ActionArgs) => {
  const formPayload = Object.fromEntries(await request.formData());
  const quoteSchema = z.object({
    quote: z.string().min(1),
    author: z.string().min(1),
    date: z.string().min(1),
    associated_user_id: z.string().min(1),
    note: z.string(),
  });

  try {
    const quote = quoteSchema.parse(formPayload);
    const error = await insertQuote(quote);
    if (error) throw new Error(error.message);
    return json({ success: true });
  } catch (e) {
    console.log(e);
    return json({ success: false });
  }
};

export default function Blog() {
  const { userId, quotes } = useLoaderData<typeof loader>();

  return (
    <div className="font-semibold mb-10">
      <MenuBar showProfileContent userId={userId} />
      <BodyContainer serif>
        <h2 className="text-3xl mb-4">Quotes</h2>
        {quotes?.map((quote) => {
          return (
            <div key={quote.id} className="mb-4">
              <p className="text-xl font-semibold">{quote.quote}</p>
              <p className="text-md font-semibold">
                {quote.author} ({quote.date})
              </p>
            </div>
          );
        })}
        {userId && (
          <div className="w-full justify-center flex">
            <AddQuoteDialog userId={userId} />
          </div>
        )}
      </BodyContainer>
    </div>
  );
}

const AddQuoteDialog = ({ userId }: { userId: number }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <PlusCircleIcon className="w-8 h-8 hover:scale-125 transition-all rounded-full" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <Form method="POST">
          <DialogHeader>
            <DialogTitle>Add a quote</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="quote" className="text-right pt-1">
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
              <Label htmlFor="note" className="text-right pt-1">
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
  );
};
