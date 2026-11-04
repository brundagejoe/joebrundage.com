"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Section } from "@/shared/ui/plate"

type Result = {
  n: bigint
  k: bigint
  combinations: bigint
  permutations: bigint
}

const LABEL_CLASS =
  "plate-label text-[0.72rem] font-medium uppercase tracking-[0.1em] opacity-70"

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
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="max-w-[44rem]">
          <h1 className="text-[1.9rem] leading-tight">N Choose K</h1>
          <p className="mt-4 max-w-[32em]">
            Enter N and K to calculate combinations (nCk) and permutations
            (nPk).
          </p>

          <Section>Inputs</Section>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
            <div className="grid gap-1">
              <Label htmlFor="n-input" className={LABEL_CLASS}>
                N
              </Label>
              <Input
                id="n-input"
                inputMode="numeric"
                placeholder="e.g. 10"
                value={nInput}
                onChange={(event) => setNInput(event.target.value)}
                required
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor="k-input" className={LABEL_CLASS}>
                K
              </Label>
              <Input
                id="k-input"
                inputMode="numeric"
                placeholder="e.g. 3"
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
              <Section>Result</Section>
              <table className="plate-data mt-3 w-full text-[0.95rem]">
                <tbody>
                  <tr className="border-b border-current/20">
                    <th
                      scope="row"
                      className="py-2 pr-5 text-left align-top font-normal opacity-70"
                    >
                      {result.n.toString()}C{result.k.toString()}
                    </th>
                    <td className="py-2 text-right break-all">
                      {result.combinations.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-current/20">
                    <th
                      scope="row"
                      className="py-2 pr-5 text-left align-top font-normal opacity-70"
                    >
                      {result.n.toString()}P{result.k.toString()}
                    </th>
                    <td className="py-2 text-right break-all">
                      {result.permutations.toLocaleString()}
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
