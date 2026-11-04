import { Link } from "@/shared/ui/link"
import { Section } from "@/shared/ui/plate"

export default function ProjectsPage() {
  const projects = [
    {
      name: "Bookclub",
      description:
        "Create a private book club, share an invite link, collect pitches, run ranked-choice voting, and schedule your next discussion with Google Calendar/iCal support.",
      href: "/projects/bookclub",
      external: false,
    },
    {
      name: "SimpleGL",
      description:
        "A minimal, production-oriented template for using WebGL in React without heavy abstractions or complex setup. Designed to make low-level graphics work approachable in a modern web stack, combining React, TypeScript, Vite, Rust, and WebAssembly, with a focus on clean system boundaries and performance-aware rendering.",
      href: "https://github.com/brundagejoe/simple-gl",
      external: true,
    },
    {
      name: "The Witch’s Cat",
      description:
        "Animated capstone film produced at BYU (Class of 2023). Served as FX Technical Director, owning the fire effects used throughout the film, and led early research and development for the animation pipeline, balancing visual quality, performance constraints, and production timelines in a collaborative environment.",
      href: "https://animation.byu.edu/the-witchs-cat-2023",
      external: true,
    },
    {
      name: "Raytracer (C++)",
      description:
        "A raytracer implemented from scratch in C++ using only the standard library. Supports both basic ray tracing and brute-force path tracing, with an emphasis on algorithmic clarity, performance tradeoffs, and a deep understanding of rendering fundamentals.",
      href: "https://github.com/brundagejoe/cs455-raytracer",
      external: true,
    },
  ]

  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[60rem] px-6 pt-14 pb-32">
        <h1 className="text-[1.9rem] leading-tight">Projects</h1>
        <p className="mt-4 max-w-[32em]">
          A collection of projects I’ve worked on, ranging from web applications
          to graphics and animation work.
        </p>

        <Section>Selected work</Section>
        <ul className="max-w-[44rem]">
          {projects.map((project) => (
            <li
              key={project.name}
              className="border-b border-current/15 py-6 last:border-b-0"
            >
              <h2 className="text-[1.35rem] leading-snug">
                <Link href={project.href} external={project.external}>
                  {project.name}
                </Link>
                {project.external ? (
                  <span className="plate-label ml-2 align-middle text-[0.72rem] font-medium uppercase tracking-[0.1em] opacity-70">
                    External
                  </span>
                ) : null}
              </h2>
              <p className="mt-2 max-w-[32em]">{project.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
