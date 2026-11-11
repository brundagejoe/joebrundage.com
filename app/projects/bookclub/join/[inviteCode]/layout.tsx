import type { ReactNode } from "react"

import { pageMetadata } from "@/shared/lib/metadata"

export const metadata = pageMetadata({
  title: "Join a book club",
  description:
    "You’ve been invited to a book club. Log in to accept the invite, pitch books, and vote on what to read next.",
  noindex: true,
})

export default function Layout({ children }: { children: ReactNode }) {
  return children
}
