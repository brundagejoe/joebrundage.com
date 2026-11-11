import type { Metadata } from "next"

import { pageMetadata } from "@/shared/lib/metadata"

export type ToolDefinition = {
  code: string
  title: string
  href: string
  /** Meta description: one or two sentences, roughly 110–160 characters. */
  description: string
  noindex?: boolean
}

export const TOOLS: ToolDefinition[] = [
  {
    code: "MS",
    title: "Money Stuff",
    href: "/tools/ms",
    description:
      "Recent Money Stuff columns from Bloomberg, linked through archive.ph.",
    noindex: true,
  },
  {
    code: "NCK",
    title: "N Choose K Calculator",
    href: "/tools/nck",
    description:
      "Calculate combinations (nCk) and permutations (nPk) for any N and K, with exact results even for very large numbers.",
  },
  {
    code: "ORGC",
    title: "Org Chart Composer",
    href: "/tools/orgc",
    description:
      "Write an org chart in a Mermaid-like text format and get a rendered chart with boxes and connectors, ready to copy as a PNG.",
  },
  {
    code: "BABT",
    title: "Bayesian A/B Test Calculator",
    href: "/tools/bayesian-ab-test",
    description:
      "Enter visitors and conversions for two variants to see the chance B beats A, the plausible size of the lift, and the expected cost of shipping today.",
  },
  {
    code: "BABTP",
    title: "Bayesian A/B Testing Primer",
    href: "/tools/bayesian-ab-testing-primer",
    description:
      "An interactive introduction to Bayesian A/B testing: beta distributions, posterior updates, the chance B beats A, expected loss, and when to stop a test.",
  },
  {
    code: "BBI",
    title: "Beta–Bernoulli Inference",
    href: "/tools/beta-bernoulli-inference",
    description:
      "Combine a prior belief with a run of yes-or-no outcomes to get a full distribution over the underlying rate, not just a single estimate.",
  },
  {
    code: "HASH",
    title: "Hash Collision Probability Calculator",
    href: "/tools/hash-collisions",
    description:
      "The chance of at least one collision when hashing K items into N buckets, using the exact birthday-problem formula and its fast approximation.",
  },
  {
    code: "SSC",
    title: "A/B Test Sample Size Calculator",
    href: "/tools/sample-size-calculator",
    description:
      "How many visitors per variant does an A/B test need? Set the baseline conversion rate, minimum detectable effect, significance level, and power.",
  },
  {
    code: "BAYESP",
    title: "Bayes Primer",
    href: "/tools/bayes-primer",
    description:
      "An interactive introduction to Bayes’ rule: set a prior, add evidence, and watch the probability update in scenarios like medical screening and spam.",
  },
  {
    code: "EVP",
    title: "Expected Value Primer",
    href: "/tools/expected-value-primer",
    description:
      "An interactive introduction to expected value: weight each outcome by its probability to find a decision’s long-run average, and see what it doesn’t promise.",
  },
  {
    code: "META",
    title: "Meta Analyzer",
    href: "/tools/meta-analyzer",
    description:
      "Compare meta tags across two sites and many paths at once, such as staging against production, and see which tags are missing, changed, or identical.",
  },
  {
    code: "PZA",
    title: "Pizza Calculator",
    href: "/tools/pizza",
    description:
      "How many pizzas should you order? Enter the number of people and get an answer, assuming three slices per person and eight slices per pizza.",
  },
]

/** Metadata for a tool route, read from the TOOLS registry above. */
export function getToolMetadata(href: string): Metadata {
  const tool = TOOLS.find((entry) => entry.href === href)
  if (!tool) {
    throw new Error(`No tool registered for ${href} in shared/config/tools.ts`)
  }
  return pageMetadata({
    title: tool.title,
    description: tool.description,
    path: tool.href,
    noindex: tool.noindex,
  })
}
