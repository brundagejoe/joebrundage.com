import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BodyContainer from "~/UI/BodyContainer";
import MenuBar from "~/UI/Menubar";
import { supabase } from "~/supabase/supabase.server";

export const loader = async () => {
  let { data: quotes } = await supabase.from("quotes").select("*");

  return json({
    quotes,
  });
};
export default function Blog() {
  const { quotes } = useLoaderData<typeof loader>();
  return (
    <div className="font-semibold mb-10">
      <MenuBar />
      <BodyContainer>
        <h2 className="text-3xl mb-4">Quotes</h2>
        {quotes?.map((quote) => {
          return (
            <div key={quote.id} className="mb-4">
              <p className="text-xl font-semibold">{quote.quote}</p>
              <p className="text-md font-semibold">{quote.author}</p>
            </div>
          );
        })}
      </BodyContainer>
    </div>
  );
}
