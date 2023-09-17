import Markdoc from "@markdoc/markdoc";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Link, useLoaderData } from "@remix-run/react";
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

const originalChapters = ["I", "II", "III", "IV", "V", "VI", "VII"];

export default function SpencerChapter() {
  const { content } = useLoaderData<typeof loader>();
  const reactContent = Markdoc.renderers.react(content, React, components);
  return (
    <div className="scroll-smooth font-[Garamond] w-full flex flex-col items-center">
      <div className="flex gap-x-2">
        {originalChapters.map((chapter) => {
          return (
            <Link key={`oc-${chapter}`} to={`#original-chapter-${chapter}`}>
              {chapter}
            </Link>
          );
        })}
      </div>
      <div className="relative mt-10 max-w-2xl px-6 md:px-0 prose prose-p:text-xl/8">
        {reactContent}
      </div>
    </div>
  );
}
