import { Link } from "@/shared/ui/link"
import { Card, CardContent } from "@/shared/ui/card"

export default function Page() {
  return (
    <div className="min-h-screen pt-16">
      {/* Header Section */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-bold">Joe Brundage</h1>
            <h2 className="text-xl text-muted-foreground">Software Engineer</h2>
          </div>
          <p className="text-lg leading-relaxed">
            I work on complex, consumer-facing systems where performance, scale,
            and product impact all matter—often in fast-paced, ambiguous problem
            spaces. Currently building at{" "}
            <Link href="https://neighbor.com" external>
              Neighbor
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Scope of Work */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">Scope of Work</h2>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground mt-6">
                <li>
                  Own and evolve cross-cutting systems that span frontend,
                  backend, and infrastructure
                </li>
                <li>
                  Tackle ambiguous, high-leverage problems involving multiple
                  stakeholders and real tradeoffs
                </li>
                <li>
                  Ship performance-sensitive systems in a fast-moving startup
                  environment
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How I Work */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">How I Work</h2>
              <ul className="space-y-2 list-disc list-inside text-muted-foreground mt-6">
                <li>
                  Design architectures and provide technical direction across
                  teams
                </li>
                <li>Lead multi-engineer projects while remaining hands-on</li>
                <li>Mentor junior engineers and interns</li>
                <li>
                  Cut scope and reshape plans to better align with technical and
                  business goals
                </li>
                <li>
                  Take ownership of unclear or high-impact problems beyond my
                  immediate responsibilities
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Selected Projects */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold">Selected Projects</h2>
                <p className="text-muted-foreground">
                  Examples of systems I&apos;ve owned or led in production.
                </p>
              </div>
              <div className="flex flex-col gap-8 mt-6">
                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">
                    Server-Side Rendering Migration
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Led the migration of our search page and other high-traffic
                    pages to SSR. This required careful coordination and
                    incremental rollout. The migration resulted in meaningful
                    performance and conversion improvements and established a
                    more scalable rendering foundation.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">
                    Experimentation on Cached Pages
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Designed and implemented multivariate testing for
                    aggressively cached pages without introducing content flash
                    or performance regressions. Used CloudFront functions to
                    balance experimentation needs with caching and latency
                    constraints.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">
                    Diversity-Aware Ranking Algorithms
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Designed ranking algorithms that make results context-aware
                    of one another. This work involved reviewing academic
                    research, evaluating tradeoffs, and delivering a performant,
                    production-ready solution aligned with product goals.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">
                    Space Trace Engine (Web)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Built the core engine behind a feature that allows users to
                    annotate uploaded photos with branded shapes. Implemented in
                    Rust and compiled to low-level web targets, with a focus on
                    performance, correctness, and long-term maintainability.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-xl font-semibold">
                    Technical SEO Systems
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Currently leading technical SEO work as a large, data-driven
                    system rather than a collection of optimizations. The work
                    spans ranking strategy, infrastructure, data analysis, and
                    long-term technical planning across multiple stakeholders.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technical Depth */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">Technical Depth</h2>
              <p className="text-muted-foreground leading-relaxed mt-6">
                I have a computer science background with an emphasis in
                computer graphics, which informs how I approach performance,
                algorithms, and system design. While my day-to-day work is
                product-focused, I&apos;m comfortable working close to the metal when
                performance or correctness demand it.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About */}
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">About</h2>
              <p className="text-muted-foreground leading-relaxed mt-6">
                I&apos;ve spent the last three years at{" "}
                <Link href="https://neighbor.com" external>
                  Neighbor
                </Link>
                , a peer-to-peer storage marketplace that connects people who
                need storage space with those who have unused space in their
                homes or properties. I&apos;ve grown by taking on increasingly
                complex systems and higher-impact responsibilities in a
                fast-moving environment.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Get in Touch */}
      <section id="contact" className="bg-background">
        <div className="mx-auto max-w-4xl px-6 py-6 pb-32 flex flex-col gap-4">
          <Card>
            <CardContent className="pt-4">
              <h2 className="text-2xl font-semibold">Get in Touch</h2>
              <p className="text-muted-foreground leading-relaxed mt-6">
                If you&apos;re looking for an engineer who can own complex systems,
                move quickly, and think deeply about tradeoffs, I&apos;d love to
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
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
