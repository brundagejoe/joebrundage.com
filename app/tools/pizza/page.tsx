"use client"

import * as React from "react"

import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Section } from "@/shared/ui/plate"

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
    <div className="flex justify-center py-6 text-[1.15rem] leading-normal md:text-[1.3rem]">
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
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="max-w-[44rem]">
          <h1 className="text-[1.9rem] leading-tight">Pizza Calculator</h1>
          <p className="mt-4 max-w-[35em]">
            How many pizzas do you need to get? Enter the number of people and
            find out.
          </p>

          <Section>The formula</Section>
          <div className="mt-2">
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
            <dl className="flex flex-col gap-1 text-[0.9em]">
              <div className="flex gap-2">
                <dt className="w-5 italic">&Pi;</dt>
                <dd className="opacity-70">
                  = pizzas to order (they’re circular, so naturally a &pi;)
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-5 italic">&Delta;</dt>
                <dd className="opacity-70">= diners (hungry humans)</dd>
              </div>
            </dl>
          </div>

          <Section>Inputs</Section>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-5">
            <div className="grid gap-1">
              <Label
                htmlFor="people-input"
                className="plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70"
              >
                Number of people
              </Label>
              <Input
                id="people-input"
                inputMode="numeric"
                placeholder="e.g. 20"
                value={peopleInput}
                onChange={(event) => setPeopleInput(event.target.value)}
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
              <p className="plate-figures mt-4 text-[1.25rem] leading-[1.4] sm:text-[1.5rem]">
                For {result.people.toLocaleString()}{" "}
                {result.people === 1 ? "person" : "people"}, you need{" "}
                <strong className="font-semibold">
                  {result.pizzas.toLocaleString()}
                </strong>{" "}
                {result.pizzas === 1 ? "pizza" : "pizzas"}.
              </p>
            </>
          ) : null}

          <p className="mt-14 border-t border-current/20 pt-3 text-[0.85em] opacity-60">
            Formula discovered by Chris Pratt.
          </p>
        </div>
      </div>
    </div>
  )
}
