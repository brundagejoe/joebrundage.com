export const OriginalChapter = ({ text }: { text: string }) => {
  return (
    <h4
      id={`original-chapter-${text}`}
      className="not-prose left-0 flex text-2xl font-normal md:absolute md:-translate-y-3"
    >
      [{text}]
    </h4>
  )
}

export const ModernChapter = ({ text }: { text: string }) => {
  return (
    <h5 className="not-prose left-0 mt-10 flex text-xl font-normal uppercase md:absolute md:mt-0 md:translate-x-12 md:translate-y-6 md:text-2xl">
      <span className="hidden md:flex">{text}</span>
      <span className="flex md:hidden">Chapter {text}</span>
    </h5>
  )
}

export const Book = ({ text }: { text: string }) => {
  return <h1 className="text-center text-3xl font-normal uppercase">{text}</h1>
}

export const Section = ({
  heading,
  subheading,
}: {
  heading: string
  subheading: string
}) => {
  // TODO: Figure out what to do with these underscores
  if (heading.includes("_")) {
    heading = heading.replace(/_.{1}/g, "")
  }
  return { subheading } ? (
    <div className="mb-8 flex flex-col">
      <div className="font-regular text-3xl italic">{heading}</div>
      <div className="text-lg font-light italic">{subheading}</div>
    </div>
  ) : (
    <h2 className="text-2xl">{heading}</h2>
  )
}

export const Subsection = ({ heading }: { heading: string }) => {
  // TODO: Figure out what to do with these underscores
  if (heading.includes("_")) {
    heading = heading.replace(/_.{1}/g, "")
  }
  return (
    <div className="not-prose flex flex-col items-center gap-y-10">
      <div className="w-32 border-t-2 border-gray-300" />
      <h3 className="flex h-fit text-center text-3xl/loose font-normal text-gray-500">
        {heading}
      </h3>
      <div className="w-32 border-t-2 border-gray-300" />
    </div>
  )
}
