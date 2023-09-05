import Markdoc from "@markdoc/markdoc";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { components, config } from "~/spencer/markdoc/Config";
import { getContent } from "~/utils/content.server";
import { requirePassword } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requirePassword(request);
  const spencerContent = await getContent("spencer/1-nephi.markdoc");
  if (!spencerContent.success) {
    throw json(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const ast = Markdoc.parse(spencerContent.content);
  const content = Markdoc.transform(ast, config);
  return json({ content: content });
};

export default function SpencerChapter() {
  const { content } = useLoaderData<typeof loader>();
  const reactContent = Markdoc.renderers.react(content, React, components);
  return (
    <div className="font-serif w-full flex flex-col items-center">
      <div className="mt-10 px-10 max-w-3xl">{reactContent}</div>
    </div>
  );
}
