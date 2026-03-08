import * as React from "react"

import { cn } from "@/shared/lib/utils"

const THEMES = ["light", "dark", "terminal"] as const

type ThemeName = (typeof THEMES)[number]

function applyThemeClass(theme: ThemeName) {
  return theme === "terminal" ? "dark terminal" : theme === "dark" ? "dark" : ""
}

export function StorySurface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-background text-foreground w-full rounded-3xl border border-border p-6",
        className
      )}
    >
      {children}
    </div>
  )
}

export function Stack({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-col gap-4", className)}>{children}</div>
}

export function Inline({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  )
}

export function ThemeMatrix({
  render,
  className,
}: {
  render: (theme: ThemeName) => React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {THEMES.map((theme) => (
        <div
          key={theme}
          className={cn(
            applyThemeClass(theme),
            "bg-background text-foreground rounded-3xl border border-border"
          )}
        >
          <div className="border-border/70 text-muted-foreground border-b px-4 py-2 text-xs font-medium uppercase tracking-[0.2em]">
            {theme}
          </div>
          <div className="p-4">{render(theme)}</div>
        </div>
      ))}
    </div>
  )
}
