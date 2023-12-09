import type { LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import BodyContainer from "~/UI/BodyContainer";
import MenuBar from "~/UI/Menubar";

export const loader = async ({ params, request }: LoaderArgs) => {
  const { article: articleTitle } = params;
  return {
    articleTitle,
  };
};
export default function Quotes() {
  const { articleTitle } = useLoaderData<typeof loader>();
  return (
    <div className="font-semibold mb-10">
      <MenuBar />
      <BodyContainer>
        <h2 className="text-3xl mb-4">{articleTitle}</h2>
      </BodyContainer>
    </div>
  );
}
