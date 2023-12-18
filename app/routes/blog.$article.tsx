import Markdoc from "@markdoc/markdoc";
import { json, type LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import BodyContainer from "~/UI/BodyContainer";
import { getBlogContent } from "~/utils/content.server";
import yaml from "js-yaml";
import clsx from "clsx";

const separateFirstParagraph = (content: string) => {
  const startOfFirstParagraphIndex = content.indexOf("---\n", 1) + 4;
  const endOfFirstParagraphIndex = content.indexOf(
    "\n",
    startOfFirstParagraphIndex
  );
  const firstParagraph = content.substring(
    startOfFirstParagraphIndex,
    endOfFirstParagraphIndex
  );
  const cleanedContent =
    content.substring(0, startOfFirstParagraphIndex) +
    content.substring(endOfFirstParagraphIndex + 1);
  return { firstParagraph, cleanedContent };
};

export const loader = async ({ params }: LoaderArgs) => {
  const { article: articleTitle } = params;
  const { success, content } = await getBlogContent(articleTitle);
  if (!success) {
    throw json(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  const { firstParagraph, cleanedContent } = separateFirstParagraph(content);

  const ast = Markdoc.parse(cleanedContent);

  const frontmatter = yaml.load(ast.attributes.frontmatter) as {
    title: string;
    description: string;
    author: string;
    date: string;
  };
  const markdocContent = Markdoc.transform(ast);
  return json({ content: markdocContent, frontmatter, firstParagraph });
};
export default function Quotes() {
  const { content, frontmatter, firstParagraph } =
    useLoaderData<typeof loader>();

  const reactContent = Markdoc.renderers.react(content, React);
  return (
    <div className="font-semibold mb-10">
      <BodyContainer>
        <div className="mt-4 font-display font-thin text-center gap-y-4 flex flex-col">
          <h1 className="text-5xl uppercase tracking-wide">
            {frontmatter.title}
          </h1>
          <h2 className="text-2xl">{frontmatter.description}</h2>
          <h2 className="text-2xl">By {frontmatter.author}</h2>
        </div>
        <article
          className={clsx(
            "mt-4 prose text-xl font-thin text-black font-display",
            "prose-headings:uppercase prose-headings:font-thin prose-headings:text-center prose-headings:border-gray-400 prose-headings:border-y-2 prose-headings:py-4 prose-headings:mx-8"
          )}
        >
          <p className="not-prose first-line:uppercase first-line:tracking-widest first-letter:text-7xl first-letter:font-bold first-letter:mr-3 first-letter:float-left">
            {firstParagraph}
          </p>
          {reactContent}
        </article>
      </BodyContainer>
    </div>
  );
}
