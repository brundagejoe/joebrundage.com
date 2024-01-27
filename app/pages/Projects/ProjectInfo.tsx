import { Link } from "@remix-run/react"

interface ProjectInfoProps {
  projectName: string
  projectDescription: string
  projectLink?: string
  projectLogo: JSX.Element
}

const OptionalLink = ({
  link,
  children,
  className,
}: {
  link?: string
  children: React.ReactNode
  className?: string
}) => {
  return link ? (
    <Link className={className} to={link} target="_blank">
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  )
}

const ProjectInfo = ({
  projectName,
  projectDescription,
  projectLink,
  projectLogo,
}: ProjectInfoProps) => {
  return (
    <OptionalLink
      link={projectLink}
      className="flex h-full w-[350px] cursor-pointer flex-col rounded-lg bg-gray-100 p-12 text-2xl font-medium"
    >
      {projectLogo}
      <h2 className="mb-4 mt-8">{projectName}</h2>
      <p className="text-gray-500">{projectDescription}</p>
    </OptionalLink>
  )
}

export default ProjectInfo
