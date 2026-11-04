"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Section } from "@/shared/ui/plate"

type Result = {
  exact: number
  approximate: number
}

const LABEL_CLASS =
  "plate-label text-[0.72rem] font-medium uppercase tracking-[0.1em] opacity-70"

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
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="max-w-[44rem]">
          <h1 className="text-[1.9rem] leading-tight">
            Hash Collision Probability
          </h1>
          <p className="mt-4 max-w-[32em]">
            Enter N buckets and K items. This uses the birthday-problem formulas
            from Kevin Galligan’s article.
          </p>

          <Section>Inputs</Section>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
            <div className="grid gap-1">
              <Label htmlFor="n-input" className={LABEL_CLASS}>
                N (number of buckets)
              </Label>
              <Input
                id="n-input"
                inputMode="numeric"
                placeholder="e.g. 100000"
                value={nInput}
                onChange={(event) => setNInput(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="k-input" className={LABEL_CLASS}>
                K (number of items)
              </Label>
              <Input
                id="k-input"
                inputMode="numeric"
                placeholder="e.g. 500"
                value={kInput}
                onChange={(event) => setKInput(event.target.value)}
                required
              />
            </div>

            <div>
              <Button type="submit">Calculate</Button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 text-[0.9em] text-destructive">{error}</p>
          ) : null}

          {result ? (
            <>
              <Section>Probability of a collision</Section>
              <table className="plate-data mt-3 w-full text-[0.95rem]">
                <tbody>
                  <tr className="border-b border-current/20">
                    <th
                      scope="row"
                      className="py-2 pr-5 text-left font-normal opacity-70"
                    >
                      Exact
                    </th>
                    <td className="py-2 text-right">
                      {formatProbability(result.exact)}
                    </td>
                  </tr>
                  <tr className="border-b border-current/20">
                    <th
                      scope="row"
                      className="py-2 pr-5 text-left font-normal opacity-70"
                    >
                      Approximate
                    </th>
                    <td className="py-2 text-right">
                      {formatProbability(result.approximate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
