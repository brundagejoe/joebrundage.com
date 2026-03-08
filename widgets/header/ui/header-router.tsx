"use client"

import { usePathname } from "next/navigation"

import { Header } from "./header"
import { ToolsHeader } from "./tools-header"

export function HeaderRouter() {
  const pathname = usePathname()
  const isToolsRoute = pathname === "/tools" || pathname?.startsWith("/tools/")

  if (isToolsRoute) {
    return <ToolsHeader />
  }

  return <Header />
}
