export const OriginalChapter = ({ text }: { text: string }) => {
  return (
    <h4
      id={`original-chapter-${text}`}
      className="not-prose text-2xl font-normal flex left-0 md:absolute md:-translate-x-24 md:-translate-y-3"
    >
      [{text}]
    </h4>
  );
};

export const ModernChapter = ({ text }: { text: string }) => {
  return (
    <h5 className="not-prose mt-10 md:mt-0 text-xl md:text-2xl font-normal uppercase flex left-0 md:absolute md:-translate-x-8 md:translate-y-6">
      <span className="hidden md:flex">{text}</span>
      <span className="flex md:hidden">Chapter {text}</span>
    </h5>
  );
};

export const Book = ({ text }: { text: string }) => {
  return <h1 className="text-3xl font-normal text-center uppercase">{text}</h1>;
};

export const Section = ({
  heading,
  subheading,
}: {
  heading: string;
  subheading: string;
}) => {
  // TODO: Figure out what to do with these underscores
  if (heading.includes("_")) {
    heading = heading.replace(/_.{1}/g, "");
  }
  return { subheading } ? (
    <div className="flex flex-col mb-8">
      <div className="text-3xl font-regular italic">{heading}</div>
      <div className="text-lg italic font-light">{subheading}</div>
    </div>
  ) : (
    <h2 className="text-2xl">{heading}</h2>
  );
};

export const Subsection = ({ heading }: { heading: string }) => {
  // TODO: Figure out what to do with these underscores
  if (heading.includes("_")) {
    heading = heading.replace(/_.{1}/g, "");
  }
  return (
    <div className="not-prose flex flex-col gap-y-10 items-center">
      <div className="border-t-2 border-gray-300 w-32" />
      <h3 className="flex h-fit text-center text-3xl/loose font-normal text-gray-500">
        {heading}
      </h3>
      <div className="border-t-2 border-gray-300 w-32" />
    </div>
  );
};
