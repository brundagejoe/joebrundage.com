"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Section } from "@/shared/ui/plate"
import { Textarea } from "@/shared/ui/textarea"

type Tag = Record<string, string>
type FetchResult = { ok: true; tags: Tag[] } | { ok: false; error: string }

type DiffBuckets = {
  onlyLeft: Tag[]
  onlyRight: Tag[]
  different: Array<{ left: Tag; right: Tag }>
  identical: Array<{ left: Tag; right: Tag }>
}

type PathResult = {
  path: string
  leftUrl: string | null
  rightUrl: string | null
  leftError: string | null
  rightError: string | null
  leftTags: Tag[] | null
  rightTags: Tag[] | null
  metaDiff: DiffBuckets | null
}

type AnalyzeInput = {
  leftBase: string | null
  rightBase: string | null
  paths: string[]
  mode: "both" | "left" | "right"
}

type AnalyzeOutput = {
  mode: "both" | "left" | "right"
  results: PathResult[]
}

const STATUS_STYLES: Record<string, string> = {
  "Only in URL 1": "opacity-80",
  "Only in URL 2": "opacity-80",
  Different: "opacity-100",
  Identical: "opacity-40",
}

const LABEL_CLASS =
  "plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70"

function SubsectionHeading({
  title,
  counts,
}: {
  title: string
  counts: Array<{ label: string; value: number }>
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-current/20 pb-1">
      <h4 className="plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
        {title}
      </h4>
      <dl className="plate-data flex gap-4 text-[0.88rem]">
        {counts.map((count) => (
          <div key={count.label} className="flex gap-1">
            <dt className="opacity-50">{count.label}</dt>
            <dd>{count.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function normalizeBaseUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }
  try {
    const url = new URL(trimmed)
    return url.toString().replace(/\/$/, "")
  } catch {
    return null
  }
}

function normalizePaths(multiline: string): string[] {
  const unique = new Set<string>()
  for (const rawLine of multiline.split("\n")) {
    const line = rawLine.trim()
    if (!line) {
      continue
    }
    const normalized = line.startsWith("/") ? line : `/${line}`
    unique.add(normalized)
  }
  return [...unique]
}

function stringifyTag(tag: Tag): string {
  const keys = Object.keys(tag).sort()
  return keys.map((key) => `${key}=${tag[key]}`).join("|")
}

function logicalMetaKey(tag: Tag): string {
  return tag.name || tag.property || tag.charset || tag["http-equiv"] || "other"
}

function compareMetaTags(left: Tag[], right: Tag[]): DiffBuckets {
  const remainingLeft = [...left]
  const remainingRight = [...right]
  const identical: Array<{ left: Tag; right: Tag }> = []
  const different: Array<{ left: Tag; right: Tag }> = []
  const onlyLeft: Tag[] = []
  const onlyRight: Tag[] = []

  for (let i = remainingLeft.length - 1; i >= 0; i -= 1) {
    const leftTag = remainingLeft[i]
    const leftSignature = stringifyTag(leftTag)
    const matchIndex = remainingRight.findIndex(
      (rightTag) => stringifyTag(rightTag) === leftSignature
    )
    if (matchIndex >= 0) {
      identical.push({ left: leftTag, right: remainingRight[matchIndex] })
      remainingLeft.splice(i, 1)
      remainingRight.splice(matchIndex, 1)
    }
  }

  const rightGroups = new Map<string, Tag[]>()
  for (const tag of remainingRight) {
    const key = logicalMetaKey(tag)
    const group = rightGroups.get(key) || []
    group.push(tag)
    rightGroups.set(key, group)
  }

  for (const leftTag of remainingLeft) {
    const key = logicalMetaKey(leftTag)
    const group = rightGroups.get(key)
    if (group && group.length > 0) {
      const rightTag = group.shift()!
      different.push({ left: leftTag, right: rightTag })
      continue
    }
    onlyLeft.push(leftTag)
  }

  for (const group of rightGroups.values()) {
    onlyRight.push(...group)
  }

  return { onlyLeft, onlyRight, different, identical }
}

function tagToDisplay(tag: Tag): string {
  return Object.entries(tag)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ")
}

function parseHtmlMetaTags(html: string): Tag[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const tags: Tag[] = []

  doc.querySelectorAll("meta").forEach((element) => {
    const attrs: Tag = {}
    for (const attr of element.attributes) {
      if (attr.value.trim()) {
        attrs[attr.name] = attr.value
      }
    }
    if (Object.keys(attrs).length > 0) {
      tags.push(attrs)
    }
  })

  return tags
}

async function fetchAndExtract(url: string): Promise<FetchResult> {
  try {
    const response = await fetch(
      `/api/tools/meta-analyzer/fetch?url=${encodeURIComponent(url)}`
    )
    const payload = (await response.json()) as { html?: string; error?: string }
    if (!response.ok || !payload.html) {
      return {
        ok: false,
        error: payload.error || `Request failed for ${url}`,
      }
    }
    return { ok: true, tags: parseHtmlMetaTags(payload.html) }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown request failure.",
    }
  }
}

function DiffSection({ diff }: { diff: DiffBuckets }) {
  const entries: Array<{ status: keyof typeof STATUS_STYLES; content: string }> = []
  for (const tag of diff.onlyLeft) {
    entries.push({ status: "Only in URL 1", content: tagToDisplay(tag) })
  }
  for (const tag of diff.onlyRight) {
    entries.push({ status: "Only in URL 2", content: tagToDisplay(tag) })
  }
  for (const pair of diff.different) {
    entries.push({
      status: "Different",
      content: `URL 1: ${tagToDisplay(pair.left)}\nURL 2: ${tagToDisplay(pair.right)}`,
    })
  }
  for (const pair of diff.identical) {
    entries.push({ status: "Identical", content: tagToDisplay(pair.left) })
  }

  return (
    <div>
      <SubsectionHeading
        title="Meta tags"
        counts={[
          { label: "L", value: diff.onlyLeft.length },
          { label: "R", value: diff.onlyRight.length },
          { label: "D", value: diff.different.length },
          { label: "I", value: diff.identical.length },
        ]}
      />
      {entries.length === 0 ? (
        <p className="mt-3 text-[0.9em] opacity-60">No tags found.</p>
      ) : (
        <ul>
          {entries.map((entry, index) => (
            <li
              key={`${entry.status}-${index}`}
              className={`grid gap-1 border-b border-current/10 py-2 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4 ${STATUS_STYLES[entry.status]}`}
            >
              <span className="plate-label pt-0.5 text-[0.8rem] font-medium uppercase tracking-[0.1em]">
                {entry.status}
              </span>
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs">
                {entry.content}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function InventorySection({ tags }: { tags: Tag[] }) {
  return (
    <div>
      <SubsectionHeading
        title="Meta tags"
        counts={[{ label: "Total", value: tags.length }]}
      />
      {tags.length === 0 ? (
        <p className="mt-3 text-[0.9em] opacity-60">No tags found.</p>
      ) : (
        <ul>
          {tags.map((tag, index) => (
            <li key={`meta-${index}`} className="border-b border-current/10 py-2">
              <pre className="overflow-x-auto text-xs">{tagToDisplay(tag)}</pre>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MetaAnalyzerPage() {
  const [leftBaseInput, setLeftBaseInput] = React.useState("")
  const [rightBaseInput, setRightBaseInput] = React.useState("")
  const [pathsInput, setPathsInput] = React.useState("")
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  )

  const analyzeMutation = useMutation<AnalyzeOutput, Error, AnalyzeInput>({
    mutationFn: async ({ leftBase, rightBase, paths, mode }) => {
      const results = await Promise.all(
        paths.map(async (path): Promise<PathResult> => {
          const leftUrl = leftBase ? `${leftBase}${path}` : null
          const rightUrl = rightBase ? `${rightBase}${path}` : null

          const [leftFetch, rightFetch] = await Promise.all([
            leftUrl ? fetchAndExtract(leftUrl) : Promise.resolve(null),
            rightUrl ? fetchAndExtract(rightUrl) : Promise.resolve(null),
          ])

          const leftError = leftFetch && !leftFetch.ok ? leftFetch.error : null
          const rightError = rightFetch && !rightFetch.ok ? rightFetch.error : null
          const leftTags = leftFetch && leftFetch.ok ? leftFetch.tags : null
          const rightTags = rightFetch && rightFetch.ok ? rightFetch.tags : null

          if (mode === "both" && !leftTags && !rightTags) {
            return {
              path,
              leftUrl,
              rightUrl,
              leftError,
              rightError,
              leftTags,
              rightTags,
              metaDiff: null,
            }
          }

          if (mode === "both") {
            return {
              path,
              leftUrl,
              rightUrl,
              leftError,
              rightError,
              leftTags,
              rightTags,
              metaDiff: compareMetaTags(leftTags || [], rightTags || []),
            }
          }

          const inventoryTags = leftTags || rightTags || []
          return {
            path,
            leftUrl,
            rightUrl,
            leftError,
            rightError,
            leftTags: mode === "left" ? inventoryTags : null,
            rightTags: mode === "right" ? inventoryTags : null,
            metaDiff:
              mode === "left"
                ? {
                    onlyLeft: inventoryTags,
                    onlyRight: [],
                    different: [],
                    identical: [],
                  }
                : {
                    onlyLeft: [],
                    onlyRight: inventoryTags,
                    different: [],
                    identical: [],
                  },
          }
        })
      )

      const hasComparableData = results.some((result) => result.metaDiff)
      if (!hasComparableData) {
        throw new Error("No valid comparison data was produced.")
      }

      return { mode, results }
    },
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const leftBase = normalizeBaseUrl(leftBaseInput)
    const rightBase = normalizeBaseUrl(rightBaseInput)
    const normalizedPaths = normalizePaths(pathsInput)

    if (!leftBase && !rightBase) {
      setValidationError("Provide at least one base URL.")
      return
    }

    if (leftBaseInput.trim() && !leftBase) {
      setValidationError("Base URL 1 is invalid.")
      return
    }

    if (rightBaseInput.trim() && !rightBase) {
      setValidationError("Base URL 2 is invalid.")
      return
    }

    if (normalizedPaths.length === 0) {
      setValidationError("Provide at least one path.")
      return
    }

    const runMode: "both" | "left" | "right" =
      leftBase && rightBase ? "both" : leftBase ? "left" : "right"

    setValidationError(null)
    analyzeMutation.reset()
    analyzeMutation.mutate({
      leftBase,
      rightBase,
      paths: normalizedPaths,
      mode: runMode,
    })
  }

  const mode = analyzeMutation.data?.mode ?? "both"
  const results = analyzeMutation.data?.results ?? []
  const error =
    validationError ??
    (analyzeMutation.isError
      ? analyzeMutation.error.message
      : null)
  const running = analyzeMutation.isPending

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="max-w-[44rem]">
          <h1 className="text-[1.9rem] leading-tight">Meta Analyzer</h1>
          <p className="mt-4 max-w-[35em]">
            Compare meta tags across two base URLs and many paths.
          </p>

          <Section>Inputs</Section>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
            <div className="grid gap-1">
              <Label htmlFor="left-base" className={LABEL_CLASS}>
                Base URL 1
              </Label>
              <Input
                id="left-base"
                placeholder="https://example.com"
                value={leftBaseInput}
                onChange={(event) => setLeftBaseInput(event.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="right-base" className={LABEL_CLASS}>
                Base URL 2
              </Label>
              <Input
                id="right-base"
                placeholder="https://staging.example.com"
                value={rightBaseInput}
                onChange={(event) => setRightBaseInput(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paths" className={LABEL_CLASS}>
                Paths (one per line)
              </Label>
              <Textarea
                id="paths"
                placeholder={"/\n/about\n/blog/post"}
                value={pathsInput}
                onChange={(event) => setPathsInput(event.target.value)}
                rows={8}
                required
              />
            </div>
            <div>
              <Button type="submit" disabled={running}>
                {running ? "Analyzing…" : "Analyze"}
              </Button>
            </div>
            {error ? (
              <p className="text-[0.9em] text-destructive">{error}</p>
            ) : null}
          </form>
        </div>

        {results.length > 0 ? <Section>Results</Section> : null}
        {results.map((result) => (
          <article key={result.path} className="mt-8">
            <h3 className="plate-data text-[1.2rem] font-medium">{result.path}</h3>
            <div className="mt-2 flex flex-col gap-1 text-[0.9em]">
              {result.leftUrl ? (
                <a
                  href={result.leftUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all underline decoration-current/35 underline-offset-4 hover:decoration-current"
                >
                  <span className="opacity-60">URL 1:</span> {result.leftUrl}
                </a>
              ) : null}
              {result.rightUrl ? (
                <a
                  href={result.rightUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all underline decoration-current/35 underline-offset-4 hover:decoration-current"
                >
                  <span className="opacity-60">URL 2:</span> {result.rightUrl}
                </a>
              ) : null}
              {result.leftError ? (
                <p className="text-destructive">{result.leftError}</p>
              ) : null}
              {result.rightError ? (
                <p className="text-destructive">{result.rightError}</p>
              ) : null}
            </div>
            <div className="mt-4">
              {mode === "both" && !result.metaDiff ? (
                <p className="text-[0.9em] opacity-60">
                  Both URL requests failed for this path. Diff not rendered.
                </p>
              ) : null}
              {mode === "both" && result.metaDiff ? <DiffSection diff={result.metaDiff} /> : null}
              {mode === "left" && result.leftTags ? <InventorySection tags={result.leftTags} /> : null}
              {mode === "right" && result.rightTags ? <InventorySection tags={result.rightTags} /> : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
