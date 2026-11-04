import { Link } from "@/shared/ui/link"
import { Row, Section } from "@/shared/ui/plate"

const selectedProjects = [
  {
    title: "Server-side rendering migration",
    description:
      "Led the migration of our search page and other high-traffic pages to SSR. This required careful coordination and incremental rollout. The migration resulted in meaningful performance and conversion improvements and established a more scalable rendering foundation.",
  },
  {
    title: "Experimentation on cached pages",
    description:
      "Designed and implemented multivariate testing for aggressively cached pages without introducing content flash or performance regressions. Used CloudFront functions to balance experimentation needs with caching and latency constraints.",
  },
  {
    title: "Diversity-aware ranking algorithms",
    description:
      "Designed ranking algorithms that make results context-aware of one another. This work involved reviewing academic research, evaluating tradeoffs, and delivering a performant, production-ready solution aligned with product goals.",
  },
  {
    title: "Space Trace engine (web)",
    description:
      "Built the core engine behind a feature that allows users to annotate uploaded photos with branded shapes. Implemented in Rust and compiled to low-level web targets, with a focus on performance, correctness, and long-term maintainability.",
  },
  {
    title: "Technical SEO systems",
    description:
      "Currently leading technical SEO work as a large, data-driven system rather than a collection of optimizations. The work spans ranking strategy, infrastructure, data analysis, and long-term technical planning across multiple stakeholders.",
  },
]

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 max-w-[35em] list-disc space-y-2 pl-5 marker:opacity-35">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen pt-16">
      <div className="mx-auto max-w-[60rem] px-6 pt-14 pb-32">
        <Row>
          <h1 className="text-[1.9rem] leading-tight">Joe Brundage</h1>
          <p className="plate-label mt-1 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
            Software Engineer
          </p>
          <p className="mt-6 max-w-[35em] text-[1.35rem] leading-[1.4]">
            I work on complex, consumer-facing systems where performance, scale,
            and product impact all matter&nbsp;— often in fast-paced, ambiguous
            problem spaces. Currently building at{" "}
            <Link href="https://neighbor.com" external>
              Neighbor
            </Link>
            .
          </p>
        </Row>

        <Section>Scope of work</Section>
        <Row>
          <List
            items={[
              "Own and evolve cross-cutting systems that span frontend, backend, and infrastructure",
              "Tackle ambiguous, high-leverage problems involving multiple stakeholders and real tradeoffs",
              "Ship performance-sensitive systems in a fast-moving startup environment",
            ]}
          />
        </Row>

        <Section>How I work</Section>
        <Row>
          <List
            items={[
              "Design architectures and provide technical direction across teams",
              "Lead multi-engineer projects while remaining hands-on",
              "Mentor junior engineers and interns",
              "Cut scope and reshape plans to better align with technical and business goals",
              "Take ownership of unclear or high-impact problems beyond my immediate responsibilities",
            ]}
          />
        </Row>

        <Section>Selected projects</Section>
        <Row>
          <p className="mt-4 max-w-[35em]">
            Examples of systems I’ve owned or led in production.
          </p>
        </Row>
        {selectedProjects.map((project) => (
          <Row key={project.title}>
            <h3 className="mt-8 text-[1.35rem] leading-snug">
              {project.title}
            </h3>
            <p className="mt-2 max-w-[35em]">{project.description}</p>
          </Row>
        ))}

        <Section>Technical depth</Section>
        <Row>
          <p className="mt-4 max-w-[35em]">
            I have a computer science background with an emphasis in computer
            graphics, which informs how I approach performance, algorithms, and
            system design. While my day-to-day work is product-focused, I’m
            comfortable working close to the metal when performance or
            correctness demand it.
          </p>
        </Row>

        <Section>About</Section>
        <Row>
          <p className="mt-4 max-w-[35em]">
            I’ve spent the last three years at{" "}
            <Link href="https://neighbor.com" external>
              Neighbor
            </Link>
            , a peer-to-peer storage marketplace that connects people who need
            storage space with those who have unused space in their homes or
            properties. I’ve grown by taking on increasingly complex systems and
            higher-impact responsibilities in a fast-moving environment.
          </p>
        </Row>

        <div id="contact" className="scroll-mt-16">
          <Section>Get in touch</Section>
          <Row>
            <p className="mt-4 max-w-[35em]">
              If you’re looking for an engineer who can own complex systems,
              move quickly, and think deeply about tradeoffs, I’d love to
              connect. You can reach me at{" "}
              <Link href="mailto:joebrundage@icloud.com">
                joebrundage@icloud.com
              </Link>
              , find me on{" "}
              <Link href="https://github.com/brundagejoe" external>
                GitHub
              </Link>
              , or connect on{" "}
              <Link href="https://linkedin.com/in/brundagejoe" external>
                LinkedIn
              </Link>
              .
            </p>
          </Row>
        </div>
      </div>
    </div>
  )
}
