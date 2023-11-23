import Markdoc from "@markdoc/markdoc";
import { CopyIcon } from "@radix-ui/react-icons";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node"; // or cloudflare/deno
import { Link, useLoaderData } from "@remix-run/react";
import React, { useRef, useState } from "react";
import { components, config } from "~/spencer/markdoc/Config";
import { getContent } from "~/utils/content.server";
import { requireUser } from "~/utils/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  await requireUser(request);
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

  const [selectedTextYPosition, setSelectedTextYPosition] = useState<number>();
  const selection = useRef<string>();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleSelection = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!window) return;

    const windowedSelection = window.getSelection();
    if (windowedSelection?.toString()) {
      const bb = windowedSelection.getRangeAt(0).getBoundingClientRect();
      setSelectedTextYPosition(
        bb.y - contentRef.current!.getBoundingClientRect().y
      );
      selection.current = windowedSelection.toString();
    } else {
      setSelectedTextYPosition(undefined);
    }
  };

  const handleClickCopy = () => {
    if (selection.current) {
      console.log("result: ", selection.current);
      const rawText = selection.current;
      //remove all digits from the string:
      let text = rawText.replace(/[0-9]/g, "");
      //remove all new lines from the string:
      text = text.replace(/\n/g, " ");
      //check if the first char is capitalized:
      if (text[0] !== text[0].toUpperCase()) {
        text = `...${text}`;
      }
      console.log(`"${text}" (1 Nephi).`);
    } else {
      console.log("no result");
    }
  };

  return (
    <>
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
        <div
          ref={contentRef}
          className="relative mt-10 max-w-3xl px-6 md:px-24 prose prose-p:text-xl/8"
          onMouseUp={handleSelection}
          onDoubleClick={handleSelection}
        >
          <div
            onClick={handleClickCopy}
            style={{
              display: selectedTextYPosition ? "flex" : "none",
              position: "absolute",
              right: "20px",
              top: `${selectedTextYPosition}px`,
            }}
            className="group border-2 border-black w-fit hover:bg-black p-1 rounded-lg"
          >
            <CopyIcon className="w-5 h-5 group-hover:text-white" />
          </div>
          {reactContent}
        </div>
      </div>
    </>
  );
}
