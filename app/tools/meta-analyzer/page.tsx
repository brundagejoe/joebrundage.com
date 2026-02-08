"use client"

import * as React from "react"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
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

const STATUS_STYLES: Record<string, string> = {
  "Only in URL 1": "bg-blue-500/10 text-blue-700 border-blue-300",
  "Only in URL 2": "bg-orange-500/10 text-orange-700 border-orange-300",
  Different: "bg-amber-500/10 text-amber-700 border-amber-300",
  Identical: "bg-emerald-500/10 text-emerald-700 border-emerald-300",
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
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Meta Tags</h4>
        <div className="flex gap-2 text-xs">
          <Badge variant="outline">L: {diff.onlyLeft.length}</Badge>
          <Badge variant="outline">R: {diff.onlyRight.length}</Badge>
          <Badge variant="outline">D: {diff.different.length}</Badge>
          <Badge variant="outline">I: {diff.identical.length}</Badge>
        </div>
      </div>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags found.</p>
        ) : (
          entries.map((entry, index) => (
            <div key={`${entry.status}-${index}`} className="rounded-md border border-border p-2">
              <Badge variant="outline" className={STATUS_STYLES[entry.status]}>
                {entry.status}
              </Badge>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs">
                {entry.content}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function InventorySection({ tags }: { tags: Tag[] }) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Meta Tags</h4>
        <Badge variant="outline">Total: {tags.length}</Badge>
      </div>
      <div className="space-y-2">
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags found.</p>
        ) : (
          tags.map((tag, index) => (
            <pre key={`meta-${index}`} className="overflow-x-auto rounded-md border p-2 text-xs">
              {tagToDisplay(tag)}
            </pre>
          ))
        )}
      </div>
    </div>
  )
}

export default function MetaAnalyzerPage() {
  const [leftBaseInput, setLeftBaseInput] = React.useState("")
  const [rightBaseInput, setRightBaseInput] = React.useState("")
  const [pathsInput, setPathsInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [running, setRunning] = React.useState(false)
  const [results, setResults] = React.useState<PathResult[]>([])
  const [mode, setMode] = React.useState<"both" | "left" | "right">("both")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const leftBase = normalizeBaseUrl(leftBaseInput)
    const rightBase = normalizeBaseUrl(rightBaseInput)
    const normalizedPaths = normalizePaths(pathsInput)

    if (!leftBase && !rightBase) {
      setError("Provide at least one base URL.")
      setResults([])
      return
    }

    if (leftBaseInput.trim() && !leftBase) {
      setError("Base URL 1 is invalid.")
      setResults([])
      return
    }

    if (rightBaseInput.trim() && !rightBase) {
      setError("Base URL 2 is invalid.")
      setResults([])
      return
    }

    if (normalizedPaths.length === 0) {
      setError("Provide at least one path.")
      setResults([])
      return
    }

    const runMode: "both" | "left" | "right" =
      leftBase && rightBase ? "both" : leftBase ? "left" : "right"

    setMode(runMode)
    setError(null)
    setRunning(true)

    try {
      const nextResults = await Promise.all(
        normalizedPaths.map(async (path): Promise<PathResult> => {
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

          if (runMode === "both" && !leftTags && !rightTags) {
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

          if (runMode === "both") {
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
            leftTags: runMode === "left" ? inventoryTags : null,
            rightTags: runMode === "right" ? inventoryTags : null,
            metaDiff:
              runMode === "left"
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

      const hasComparableData = nextResults.some((result) => result.metaDiff)
      if (!hasComparableData) {
        setError("No valid comparison data was produced.")
        setResults([])
        return
      }

      setResults(nextResults)
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unexpected processing failure."
      )
      setResults([])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Meta Analyzer</CardTitle>
            <CardDescription>
              Compare meta tags across two base URLs and many paths.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="left-base">Base URL 1</Label>
                <Input
                  id="left-base"
                  placeholder="https://example.com"
                  value={leftBaseInput}
                  onChange={(event) => setLeftBaseInput(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="right-base">Base URL 2</Label>
                <Input
                  id="right-base"
                  placeholder="https://staging.example.com"
                  value={rightBaseInput}
                  onChange={(event) => setRightBaseInput(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paths">Paths (one per line)</Label>
                <Textarea
                  id="paths"
                  placeholder={"/\n/about\n/blog/post"}
                  value={pathsInput}
                  onChange={(event) => setPathsInput(event.target.value)}
                  rows={8}
                  required
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={running}>
                  {running ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-4">
          {results.map((result) => (
            <Card key={result.path}>
              <CardHeader>
                <CardTitle className="text-lg">{result.path}</CardTitle>
                <CardDescription>
                  <div className="flex flex-col gap-2">
                    {result.leftUrl ? (
                      <a
                        href={result.leftUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        URL 1: {result.leftUrl}
                      </a>
                    ) : null}
                    {result.rightUrl ? (
                      <a
                        href={result.rightUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        URL 2: {result.rightUrl}
                      </a>
                    ) : null}
                    {result.leftError ? <Badge variant="destructive">{result.leftError}</Badge> : null}
                    {result.rightError ? (
                      <Badge variant="destructive">{result.rightError}</Badge>
                    ) : null}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "both" && !result.metaDiff ? (
                  <p className="text-sm text-muted-foreground">
                    Both URL requests failed for this path. Diff not rendered.
                  </p>
                ) : null}
                {mode === "both" && result.metaDiff ? <DiffSection diff={result.metaDiff} /> : null}
                {mode === "left" && result.leftTags ? <InventorySection tags={result.leftTags} /> : null}
                {mode === "right" && result.rightTags ? <InventorySection tags={result.rightTags} /> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
