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
]
