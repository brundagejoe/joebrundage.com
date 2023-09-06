export const OriginalChapter = ({ text }: { text: string }) => {
  return (
    <h4 id={`original-chapter-${text}`} className="text-2xl absolute left-0">
      [{text}]
    </h4>
  );
};

export const ModernChapter = ({ text }: { text: string }) => {
  return <h5 className="text-2xl hidden ">{text}</h5>;
};

export const Book = ({ text }: { text: string }) => {
  return <h1 className="text-2xl font-black">{text}</h1>;
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
    <div className="flex flex-col">
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
  return <h3 className="text-xl italic font-normal">{heading}</h3>;
};
