"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

type Result = {
  n: bigint
  k: bigint
  combinations: bigint
  permutations: bigint
}

function parseNonNegativeInteger(value: string): bigint | null {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  try {
    return BigInt(value.trim())
  } catch {
    return null
  }
}

function nPk(n: bigint, k: bigint): bigint {
  let result = 1n
  for (let i = 0n; i < k; i += 1n) {
    result *= n - i
  }
  return result
}

function nCk(n: bigint, k: bigint): bigint {
  const smallerK = k > n - k ? n - k : k
  let result = 1n

  for (let i = 1n; i <= smallerK; i += 1n) {
    result = (result * (n - smallerK + i)) / i
  }

  return result
}

export default function NckToolPage() {
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

    if (k > n) {
      setError("K must be less than or equal to N.")
      setResult(null)
      return
    }

    setError(null)
    setResult({
      n,
      k,
      combinations: nCk(n, k),
      permutations: nPk(n, k),
    })
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold">N Choose K Tool</h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Enter N and K to calculate combinations (nCk) and permutations
            (nPk).
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="n-input">N</Label>
              <Input
                id="n-input"
                inputMode="numeric"
                placeholder="e.g. 10"
                value={nInput}
                onChange={(event) => setNInput(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="k-input">K</Label>
              <Input
                id="k-input"
                inputMode="numeric"
                placeholder="e.g. 3"
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
                <span className="font-medium">
                  {result.n.toString()}C{result.k.toString()}
                </span>{" "}
                = {result.combinations.toLocaleString()}
              </p>
              <p>
                <span className="font-medium">
                  {result.n.toString()}P{result.k.toString()}
                </span>{" "}
                = {result.permutations.toLocaleString()}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
