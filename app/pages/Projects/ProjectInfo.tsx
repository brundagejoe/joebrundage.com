interface ProjectInfoProps {
  projectName: string;
  projectDescription: string;
  projectLogo: JSX.Element;
}

const ProjectInfo = ({
  projectName,
  projectDescription,
  projectLogo,
}: ProjectInfoProps) => {
  return (
    <div className="cursor-pointer bg-gray-100 text-2xl p-12 rounded-lg font-medium w-[350px] h-full">
      {projectLogo}
      <h2 className="mt-8 mb-4">{projectName}</h2>
      <p className="text-gray-500">{projectDescription}</p>
    </div>
  );
};

export default ProjectInfo;
