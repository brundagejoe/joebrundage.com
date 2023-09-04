import { Link } from "@remix-run/react";

interface ProjectInfoProps {
  projectName: string;
  projectDescription: string;
  projectLink?: string;
  projectLogo: JSX.Element;
}

const OptionalLink = ({
  link,
  children,
  className,
}: {
  link?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return link ? (
    <Link className={className} to={link} target="_blank">
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );
};

const ProjectInfo = ({
  projectName,
  projectDescription,
  projectLink,
  projectLogo,
}: ProjectInfoProps) => {
  return (
    <OptionalLink
      link={projectLink}
      className="flex flex-col cursor-pointer bg-gray-100 text-2xl p-12 rounded-lg font-medium w-[350px] h-full"
    >
      {projectLogo}
      <h2 className="mt-8 mb-4">{projectName}</h2>
      <p className="text-gray-500">{projectDescription}</p>
    </OptionalLink>
  );
};

export default ProjectInfo;
