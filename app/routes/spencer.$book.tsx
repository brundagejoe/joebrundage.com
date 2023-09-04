import Markdoc from "@markdoc/markdoc";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { useLoaderData } from "@remix-run/react";
import { promises as fs } from "fs";
import React from "react";
import { components, config } from "~/spencer/markdoc/Config";
import { requirePassword } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requirePassword(request);
  // const file = path.join(process.cwd(), "content/spencer", "1-nephi.markdoc");
  const file = __dirname + "/../content/spencer/1-nephi.markdoc";
  const fileContent = await fs.readFile(file, "utf-8");
  const ast = Markdoc.parse(fileContent);

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
