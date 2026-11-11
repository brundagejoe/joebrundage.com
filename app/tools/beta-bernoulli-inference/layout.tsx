import type { ReactNode } from "react"

import { getToolMetadata } from "@/shared/config"

export const metadata = getToolMetadata("/tools/beta-bernoulli-inference")

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
