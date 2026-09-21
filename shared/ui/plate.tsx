import * as React from "react"

import { round } from "@/shared/lib/plot"
import { cn } from "@/shared/lib/utils"

/**
 * Typographic primitives for the data-display style documented in
 * app/tools/DATA-DISPLAY.md. Structure comes from hairline rules, whitespace
 * and small tracked labels — never from boxes.
 */

export function Section({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h2
      className={cn(
        "plate-label mt-14 border-t border-current/20 pt-2 text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55",
        className
      )}
    >
      {children}
    </h2>
  )
}

/** A block of content with an optional note set in the right margin on xl. */
export function Row({
  children,
  note,
}: {
  children: React.ReactNode
  note?: React.ReactNode
}) {
  return (
    <div className="grid gap-x-8 gap-y-3 xl:grid-cols-[minmax(0,44rem)_12rem]">
      <div className="min-w-0">{children}</div>
      {note ? (
        <aside className="text-[0.84rem] leading-relaxed opacity-60 xl:pt-1">
          {note}
        </aside>
      ) : (
        <div aria-hidden />
      )}
    </div>
  )
}

/** A figure caption: a complete sentence that carries content. */
export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-[40rem] text-[0.9rem] leading-relaxed opacity-65">
      {children}
    </p>
  )
}

/** A probability sparkline sized to sit inside a sentence. */
export function ProbabilityStrip({
  probability,
  threshold,
}: {
  probability: number
  threshold: number
}) {
  return (
    <span className="relative mx-1 inline-block h-[0.9em] w-[5rem] align-baseline">
      <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-current opacity-20" />
      <span
        className="absolute top-1/2 block h-px -translate-y-1/2 bg-current opacity-55"
        style={{ width: `${round(probability * 100)}%` }}
      />
      <span
        className="absolute top-0 block h-full w-px bg-current opacity-35"
        style={{ left: `${round(threshold * 100)}%` }}
      />
      <span
        className="absolute top-1/2 block size-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
        style={{ left: `${round(probability * 100)}%` }}
      />
    </span>
  )
}
