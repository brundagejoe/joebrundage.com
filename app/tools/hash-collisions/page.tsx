"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

type Result = {
  exact: number
  approximate: number
}

function parseNonNegativeInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  const parsed = Number(value.trim())
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function clampProbability(value: number): number {
  if (!Number.isFinite(value)) {
    return value > 0 ? 1 : 0
  }
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

function exactCollisionProbability(k: number, n: number): number {
  if (k <= 1) {
    return 0
  }
  if (k > n) {
    return 1
  }

  let logNoCollision = 0
  for (let i = 0; i < k; i += 1) {
    logNoCollision += Math.log1p(-i / n)
  }

  const noCollision = Math.exp(logNoCollision)
  return clampProbability(1 - noCollision)
}

function approximateCollisionProbability(k: number, n: number): number {
  if (k <= 1) {
    return 0
  }

  const exponent = -(k * (k - 1)) / (2 * n)
  return clampProbability(-Math.expm1(exponent))
}

function formatProbability(value: number): string {
  if (Number.isNaN(value)) {
    return "NaN"
  }
  if (!Number.isFinite(value)) {
    return value > 0 ? "1" : "0"
  }
  if (value === 0) {
    return "0"
  }
  if (value === 1) {
    return "1"
  }
  return value.toPrecision(12)
}

export default function HashCollisionsToolPage() {
  const [nInput, setNInput] = React.useState("")
  const [kInput, setKInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<Result | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const n = parseNonNegativeInteger(nInput)
    const k = parseNonNegativeInteger(kInput)

    if (n === null || k === null) {
      setError("N and K must be non-negative integers.")
      setResult(null)
      return
    }

    if (n === 0) {
      setError("N must be greater than 0.")
      setResult(null)
      return
    }

    setError(null)
    setResult({
      exact: exactCollisionProbability(k, n),
      approximate: approximateCollisionProbability(k, n),
    })
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold">
            Hash Collision Probability Tool
          </h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Enter N buckets and K items. This uses the birthday-problem formulas
            from Kevin Galligan&apos;s article.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="n-input">N (number of buckets)</Label>
              <Input
                id="n-input"
                inputMode="numeric"
                placeholder="e.g. 100000"
                value={nInput}
                onChange={(event) => setNInput(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="k-input">K (number of items)</Label>
              <Input
                id="k-input"
                inputMode="numeric"
                placeholder="e.g. 500"
                value={kInput}
                onChange={(event) => setKInput(event.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Calculate</Button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}

          {result ? (
            <div className="mt-6 flex flex-col gap-3 text-sm border-t border-border pt-4">
              <p>
                <span className="font-medium">Probability (exact):</span>{" "}
                {formatProbability(result.exact)}
              </p>
              <p>
                <span className="font-medium">Probability (approximate):</span>{" "}
                {formatProbability(result.approximate)}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
