import { Link } from "@/shared/ui/link"
import { Card, CardContent } from "@/shared/ui/card"

export default function ProjectsPage() {
  const projects = [
    {
      name: "SimpleGL",
      description:
        "A minimal, production-oriented template for using WebGL in React without heavy abstractions or complex setup. Designed to make low-level graphics work approachable in a modern web stack, combining React, TypeScript, Vite, Rust, and WebAssembly, with a focus on clean system boundaries and performance-aware rendering.",
      href: "https://github.com/brundagejoe/simple-gl",
    },
    {
      name: "The Witch's Cat",
      description:
        "Animated capstone film produced at BYU (Class of 2023). Served as FX Technical Director, owning the fire effects used throughout the film, and led early research and development for the animation pipeline, balancing visual quality, performance constraints, and production timelines in a collaborative environment.",
      href: "https://animation.byu.edu/the-witchs-cat-2023",
    },
    {
      name: "Raytracer (C++)",
      description:
        "A raytracer implemented from scratch in C++ using only the standard library. Supports both basic ray tracing and brute-force path tracing, with an emphasis on algorithmic clarity, performance tradeoffs, and a deep understanding of rendering fundamentals.",
      href: "https://github.com/brundagejoe/cs455-raytracer",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background pt-16">
      <section className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Projects</h2>
            <p className="text-muted-foreground leading-relaxed">
              A collection of projects I&apos;ve worked on, ranging from web
              applications to graphics and animation work.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {projects.map((project) => (
              <Link
                key={project.name}
                href={project.href}
                className="block text-foreground no-underline hover:no-underline"
                external
              >
                <Card>
                  <CardContent className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {project.name}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
