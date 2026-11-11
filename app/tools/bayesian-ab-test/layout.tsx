import type { ReactNode } from "react"

import { getToolMetadata } from "@/shared/config"

export const metadata = getToolMetadata("/tools/bayesian-ab-test")

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
