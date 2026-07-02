"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

type Result = {
  people: number
  pizzas: number
}

function parsePositiveInteger(value: string): number | null {
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    return null
  }

  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    return null
  }

  return parsed
}

function pizzasNeeded(people: number): number {
  return Math.ceil((people * 3) / 8)
}

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center rounded-lg border border-border/70 bg-muted/25 px-4 py-6 text-[1.15rem] leading-normal text-foreground md:text-[1.3rem]">
      {children}
    </div>
  )
}

export default function PizzaToolPage() {
  const [peopleInput, setPeopleInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<Result | null>(null)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const people = parsePositiveInteger(peopleInput)

    if (people === null) {
      setError("Number of people must be a positive whole number.")
      setResult(null)
      return
    }

    setError(null)
    setResult({
      people,
      pizzas: pizzasNeeded(people),
    })
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-xl">
          <h2 className="text-2xl font-semibold">Pizza Calculator</h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            How many pizzas do you need to get? Enter the number of people and
            find out.
          </p>

          <div className="mt-6">
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>&Pi;</mi>
                  <mo>=</mo>
                  <mrow>
                    <mo>&lceil;</mo>
                    <mfrac>
                      <mrow>
                        <mn>3</mn>
                        <mi>&Delta;</mi>
                      </mrow>
                      <mn>8</mn>
                    </mfrac>
                    <mo>&rceil;</mo>
                  </mrow>
                </mrow>
              </math>
            </MathBlock>
            <dl className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <dt className="w-5 font-serif italic text-foreground">&Pi;</dt>
                <dd>= pizzas to order (they&apos;re circular, so naturally a &pi;)</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-5 font-serif italic text-foreground">&Delta;</dt>
                <dd>= diners (hungry humans)</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="people-input">Number of people</Label>
              <Input
                id="people-input"
                inputMode="numeric"
                placeholder="e.g. 20"
                value={peopleInput}
                onChange={(event) => setPeopleInput(event.target.value)}
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
                For{" "}
                <span className="font-medium">
                  {result.people.toLocaleString()}
                </span>{" "}
                {result.people === 1 ? "person" : "people"}, you need{" "}
                <span className="text-base font-bold text-foreground">
                  {result.pizzas.toLocaleString()}
                </span>{" "}
                {result.pizzas === 1 ? "pizza" : "pizzas"}.
              </p>
            </div>
          ) : null}

          <p className="mt-8 text-xs text-muted-foreground border-t border-border pt-4">
            Formula discovered by Chris Pratt.
          </p>
        </div>
      </section>
    </div>
  )
}
