export type ToolDefinition = {
  code: string
  title: string
  href: string
}

export const TOOLS: ToolDefinition[] = [
  { code: "MS", title: "Money Stuff", href: "/tools/ms" },
  { code: "NCK", title: "N Choose K Calculator", href: "/tools/nck" },
  { code: "ORGC", title: "Org Chart Composer", href: "/tools/orgc" },
  {
    code: "BABT",
    title: "Bayesian A/B Test Calculator",
    href: "/tools/bayesian-ab-test",
  },
  {
    code: "BABTP",
    title: "Bayesian AB Testing Primer",
    href: "/tools/bayesian-ab-testing-primer",
  },
  {
    code: "BBI",
    title: "Beta-Bernoulli Inference",
    href: "/tools/beta-bernoulli-inference",
  },
  {
    code: "HASH",
    title: "Hash Collision Probability Calculator",
    href: "/tools/hash-collisions",
  },
  {
    code: "SSC",
    title: "A/B Test Sample Size Calculator",
    href: "/tools/sample-size-calculator",
  },
  { code: "BAYESP", title: "Bayes Primer", href: "/tools/bayes-primer" },
  {
    code: "EVP",
    title: "Expected Value Primer",
    href: "/tools/expected-value-primer",
  },
  { code: "META", title: "Meta Analyzer", href: "/tools/meta-analyzer" },
  { code: "PZA", title: "Pizza Calculator", href: "/tools/pizza" },
]
