export const OriginalChapter = ({ text }: { text: string }) => {
  return <h4 className="text-2xl">[{text}]</h4>;
};

export const ModernChapter = ({ text }: { text: string }) => {
  return <h5 className="text-2xl italic">{text}</h5>;
};

export const Book = ({ text }: { text: string }) => {
  return <h1 className="text-3xl">{text}</h1>;
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
    <div>
      <h2 className="text-2xl">{heading}</h2>
      <h3 className="text-xl">{subheading}</h3>
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
  return <h3 className="text-2xl">{heading}</h3>;
};
