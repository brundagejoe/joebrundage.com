import type { ReactNode } from "react"

import { pageMetadata } from "@/shared/lib/metadata"

export const metadata = pageMetadata({
  title: "Test",
  noindex: true,
})

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
