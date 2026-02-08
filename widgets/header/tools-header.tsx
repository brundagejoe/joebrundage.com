"use client"

import Link from "next/link"

import { buttonVariants } from "@/shared/ui/button"

export function ToolsHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center">
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Home
          </Link>
        </div>
      </div>
    </header>
  )
}
