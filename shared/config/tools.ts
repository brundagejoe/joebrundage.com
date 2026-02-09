export type ToolDefinition = {
  code: string
  title: string
  href: string
}

export const TOOLS: ToolDefinition[] = [
  { code: "NCK", title: "N Choose K Calculator", href: "/tools/nck" },
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
  { code: "META", title: "Meta Analyzer", href: "/tools/meta-analyzer" },
]
