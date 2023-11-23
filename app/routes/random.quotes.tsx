import { PlusCircleIcon } from "@heroicons/react/24/outline";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import BodyContainer from "~/UI/BodyContainer";
import MenuBar from "~/UI/Menubar";
import { fetchQuotes } from "~/supabase/quotes.server";
import { getUserId } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await getUserId(request);

  return json({
    userId,
    quotes: await fetchQuotes(),
  });
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
            <Link to={"/random/quotes/add"}>
              <PlusCircleIcon className="w-8 h-8 hover:scale-125 transition-all rounded-full" />
            </Link>
          </div>
        )}
      </BodyContainer>
    </div>
  );
}
