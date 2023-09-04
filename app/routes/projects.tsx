import BodyContainer from "~/UI/BodyContainer";
import {
  BookIcon,
  StatIcon,
  ScribbleIcon,
  FilmIcon,
  ShapesIcon,
} from "~/UI/Icons";
import LaunchOnMount from "~/UI/LaunchOnMount";
import MenuBar from "~/UI/Menubar";
import ProjectInfo from "~/pages/Projects/ProjectInfo";

const projects: {
  name: string;
  link?: string;
  description: string;
  logo: JSX.Element;
}[] = [
  {
    name: "Rec41",
    description:
      "A stat recorder, viewer and analyzer built for pickup and rec basketball leagues. Intuitively record play-by-plays in real-time and share with your friends.",
    logo: <StatIcon />,
  },
  {
    name: "Spencer",
    description:
      "Read the Book of Mormon and compare original and current chapters. Select and copy verses in the format you want to use in talks or papers.",
    link: "/spencer",
    logo: <BookIcon />,
  },
  {
    name: "SimpleGL",
    description:
      "A template for rendering WebGL in React. Use tailwindcss, typescript, react, vite, rust, and wasm to create anything you want. Avoid complicated setup and start using WebGL the way you want.",
    link: "https://github.com/brundagejoe/simple-gl",
    logo: <ScribbleIcon />,
  },
  {
    name: "The Witch's Cat",
    description:
      "BYU's Animated Capstone Project from the class of 2023. I was an FX TD in charge of the fire in the film. I also lead the early research and development for the film's pipeline.",
    logo: <FilmIcon />,
  },
  {
    name: "CS 455 Raytracer",
    description:
      "A simple raytracer built in C++ using only the standard libaries. Render scenes with a simple raytracing algorithm or a more complicated brute force pathtracing technique.",
    link: "https://github.com/brundagejoe/cs455-raytracer",
    logo: <ShapesIcon />,
  },
];

export default function Projects() {
  return (
    <div className="font-semibold mb-10">
      <MenuBar />
      <BodyContainer>
        <LaunchOnMount>
          <h1 className="text-4xl">Some of my favorite projects.</h1>
        </LaunchOnMount>
        <div className="mt-4 md:grid md:grid-cols-3 flex flex-col gap-8">
          {projects.map((project, index) => {
            return (
              <LaunchOnMount
                key={`project-${index}`}
                delay={(index + 1) * 100}
                enterFrom="opacity-0 translate-y-[200px] scale-150"
                enterTo="opacity-100 translate-y-0 scale-100"
              >
                <ProjectInfo
                  projectName={project.name}
                  projectDescription={project.description}
                  projectLink={project.link}
                  projectLogo={project.logo}
                />
              </LaunchOnMount>
            );
          })}
        </div>
      </BodyContainer>
    </div>
  );
}
