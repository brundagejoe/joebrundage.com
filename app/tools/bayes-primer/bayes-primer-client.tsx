"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

type BuiltInExampleKey = "medical" | "spam" | "librarian"
type ExampleKey = BuiltInExampleKey | "custom"

type ExampleConfig = {
  key: ExampleKey
  title: string
  description: string
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
  priorLabel: string
  likelihoodLabel: string
  falsePositiveLabel: string
}

type Inputs = {
  priorPercent: string
  truePositivePercent: string
  falsePositivePercent: string
}

type Result = {
  prior: number
  likelihood: number
  falsePositive: number
  posterior: number
  evidence: number
}

type CustomGenerationResponse = {
  title: string
  description: string
  priorLabel: string
  likelihoodLabel: string
  falsePositiveLabel: string
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
}

const EXAMPLES: ExampleConfig[] = [
  {
    key: "medical",
    title: "Medical screening",
    description:
      "A rare condition with a good test can still produce many false alarms.",
    priorPercent: 1,
    truePositivePercent: 99,
    falsePositivePercent: 5,
    priorLabel: "Chance a randomly selected person truly has the condition.",
    likelihoodLabel:
      "If a person has the condition, chance the test reports positive.",
    falsePositiveLabel:
      "If a person does not have the condition, chance the test still reports positive.",
  },
  {
    key: "spam",
    title: "Email spam word",
    description:
      "A suspicious word appears in most spam, but can still appear in normal mail.",
    priorPercent: 20,
    truePositivePercent: 80,
    falsePositivePercent: 10,
    priorLabel:
      "Chance an incoming message is spam before looking at this word.",
    likelihoodLabel:
      "If the message is spam, chance this suspicious word appears.",
    falsePositiveLabel:
      "If the message is not spam, chance this word still appears.",
  },
  {
    key: "librarian",
    title: "Librarian stereotype",
    description:
      "A quiet, bookish description can feel diagnostic, but base rates still matter.",
    priorPercent: 5,
    truePositivePercent: 70,
    falsePositivePercent: 20,
    priorLabel: "Chance a random person is a librarian before any description.",
    likelihoodLabel:
      "If the person is a librarian, chance they match the description.",
    falsePositiveLabel:
      "If the person is not a librarian, chance they still match the description.",
  },
]

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function parsePercentInput(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString()
}

function calculatePosterior({
  priorPercent,
  truePositivePercent,
  falsePositivePercent,
}: {
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
}): Result {
  const prior = clamp(priorPercent / 100, 0.000001, 0.999999)
  const likelihood = clamp(truePositivePercent / 100, 0.000001, 0.999999)
  const falsePositive = clamp(falsePositivePercent / 100, 0.000001, 0.999999)
  const evidence = prior * likelihood + (1 - prior) * falsePositive
  const posterior = (prior * likelihood) / evidence

  return {
    prior,
    likelihood,
    falsePositive,
    posterior,
    evidence,
  }
}

function getInitialResult(): Result {
  return calculatePosterior({
    priorPercent: EXAMPLES[0].priorPercent,
    truePositivePercent: EXAMPLES[0].truePositivePercent,
    falsePositivePercent: EXAMPLES[0].falsePositivePercent,
  })
}

type BayesPrimerClientProps = {
  canUseAiCustom: boolean
}

export function BayesPrimerClient({ canUseAiCustom }: BayesPrimerClientProps) {
  const [activeExample, setActiveExample] =
    React.useState<ExampleKey>("medical")
  const [customExample, setCustomExample] =
    React.useState<ExampleConfig | null>(null)
  const [inputs, setInputs] = React.useState<Inputs>({
    priorPercent: String(EXAMPLES[0].priorPercent),
    truePositivePercent: String(EXAMPLES[0].truePositivePercent),
    falsePositivePercent: String(EXAMPLES[0].falsePositivePercent),
  })
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<Result>(getInitialResult)

  const [isCustomDialogOpen, setIsCustomDialogOpen] = React.useState(false)
  const [customSituation, setCustomSituation] = React.useState("")
  const [customError, setCustomError] = React.useState<string | null>(null)
  const [isGeneratingCustom, setIsGeneratingCustom] = React.useState(false)

  const selectedExample = React.useMemo(() => {
    if (activeExample === "custom") {
      return customExample ?? EXAMPLES[0]
    }

    return (
      EXAMPLES.find((example) => example.key === activeExample) ?? EXAMPLES[0]
    )
  }, [activeExample, customExample])

  const handleLoadExample = (example: ExampleConfig) => {
    setActiveExample(example.key)
    setInputs({
      priorPercent: String(example.priorPercent),
      truePositivePercent: String(example.truePositivePercent),
      falsePositivePercent: String(example.falsePositivePercent),
    })
    setError(null)
    setResult(
      calculatePosterior({
        priorPercent: example.priorPercent,
        truePositivePercent: example.truePositivePercent,
        falsePositivePercent: example.falsePositivePercent,
      })
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const priorPercent = parsePercentInput(inputs.priorPercent)
    const truePositivePercent = parsePercentInput(inputs.truePositivePercent)
    const falsePositivePercent = parsePercentInput(inputs.falsePositivePercent)

    if (
      priorPercent === null ||
      truePositivePercent === null ||
      falsePositivePercent === null
    ) {
      setError("All fields must be valid numbers.")
      return
    }

    if (
      priorPercent < 0 ||
      priorPercent > 100 ||
      truePositivePercent < 0 ||
      truePositivePercent > 100 ||
      falsePositivePercent < 0 ||
      falsePositivePercent > 100
    ) {
      setError("All values must stay between 0 and 100.")
      return
    }

    setError(null)
    setResult(
      calculatePosterior({
        priorPercent,
        truePositivePercent,
        falsePositivePercent,
      })
    )
  }

  const handleGenerateCustom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    const trimmedSituation = customSituation.trim()
    if (trimmedSituation.length === 0) {
      setCustomError("Please describe a situation first.")
      return
    }

    setIsGeneratingCustom(true)
    setCustomError(null)

    try {
      const response = await fetch("/api/tools/bayes-primer/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ situation: trimmedSituation }),
      })
      const data =
        (await response.json()) as Partial<CustomGenerationResponse> & {
          error?: string
        }

      if (!response.ok) {
        throw new Error(data.error || "Could not generate a custom scenario.")
      }

      const generatedExample: ExampleConfig = {
        key: "custom",
        title: String(data.title ?? "Custom"),
        description: String(data.description ?? "Custom scenario"),
        priorLabel: String(
          data.priorLabel ?? "Prior chance before seeing evidence."
        ),
        likelihoodLabel: String(
          data.likelihoodLabel ??
            "If the claim is true, chance the signal appears."
        ),
        falsePositiveLabel: String(
          data.falsePositiveLabel ??
            "If the claim is false, chance the signal still appears."
        ),
        priorPercent: Number(data.priorPercent ?? 10),
        truePositivePercent: Number(data.truePositivePercent ?? 80),
        falsePositivePercent: Number(data.falsePositivePercent ?? 15),
      }

      setCustomExample(generatedExample)
      handleLoadExample(generatedExample)
      setCustomSituation("")
      setIsCustomDialogOpen(false)
    } catch (generationError) {
      setCustomError(
        generationError instanceof Error
          ? generationError.message
          : "Could not generate a custom scenario."
      )
    } finally {
      setIsGeneratingCustom(false)
    }
  }

  const truePositivesPer10k = result.prior * result.likelihood * 10000
  const falseNegativesPer10k = result.prior * (1 - result.likelihood) * 10000
  const falsePositivesPer10k = (1 - result.prior) * result.falsePositive * 10000
  const trueNegativesPer10k =
    (1 - result.prior) * (1 - result.falsePositive) * 10000
  const positivesPer10k = truePositivesPer10k + falsePositivesPer10k

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Bayes Primer</h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            This tool is for intuition: start with a prior belief, observe
            evidence, then see how Bayes&apos; rule updates the belief.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example.key}
                type="button"
                variant={activeExample === example.key ? "default" : "outline"}
                onClick={() => handleLoadExample(example)}
              >
                {example.title}
              </Button>
            ))}
            {canUseAiCustom ? (
              <Button
                type="button"
                variant={activeExample === "custom" ? "default" : "outline"}
                onClick={() => {
                  setCustomError(null)
                  setIsCustomDialogOpen(true)
                }}
              >
                {customExample?.title || "Custom"}
              </Button>
            ) : null}
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {selectedExample.description}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="prior-input">Prior P(H) %</Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.priorLabel}
              </p>
              <Input
                id="prior-input"
                inputMode="decimal"
                value={inputs.priorPercent}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    priorPercent: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="true-positive-input">
                Evidence sensitivity P(E|H) %
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.likelihoodLabel}
              </p>
              <Input
                id="true-positive-input"
                inputMode="decimal"
                value={inputs.truePositivePercent}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    truePositivePercent: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="false-positive-input">
                False positive rate P(E|not H) %
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.falsePositiveLabel}
              </p>
              <Input
                id="false-positive-input"
                inputMode="decimal"
                value={inputs.falsePositivePercent}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    falsePositivePercent: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Update Belief</Button>
            </div>
          </form>

          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 text-sm border-t border-border pt-4">
            <p>
              <span className="font-medium">Prior belief P(H):</span>{" "}
              {formatPercent(result.prior)}
            </p>
            <p>
              <span className="font-medium">Posterior P(H|E):</span>{" "}
              {formatPercent(result.posterior)}
            </p>
            <p>
              <span className="font-medium">Bayes denominator P(E):</span>{" "}
              {formatPercent(result.evidence)}
            </p>
          </div>

          <div className="mt-6 rounded-md border border-border p-4 text-sm">
            <p className="font-medium">How the update works</p>
            <p className="mt-2 text-muted-foreground">
              Bayes rule: P(H|E) = P(E|H) * P(H) / P(E)
            </p>
            <p className="mt-2">
              In this setup, <span className="font-medium">P(E)</span> = P(E|H)
              * P(H) + P(E|not H) * (1 - P(H)).
            </p>
            <p className="mt-2 text-muted-foreground">
              Out of 10,000 cases, about {formatCount(positivesPer10k)} test
              positive.
            </p>
            <p className="mt-1 text-muted-foreground">
              Of those positives, about {formatCount(truePositivesPer10k)} are
              true positives and about {formatCount(falsePositivesPer10k)} are
              false positives.
            </p>
            <p className="mt-1 text-muted-foreground">
              Full 10,000-case breakdown: {formatCount(truePositivesPer10k)}{" "}
              true positives, {formatCount(falsePositivesPer10k)} false
              positives, {formatCount(falseNegativesPer10k)} false negatives,
              and {formatCount(trueNegativesPer10k)} true negatives.
            </p>
          </div>
        </div>
      </section>

      <AlertDialog
        open={isCustomDialogOpen}
        onOpenChange={setIsCustomDialogOpen}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Custom Bayes Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Describe your situation and we will generate context-specific
              Bayes labels and starter percentages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form className="grid gap-4" onSubmit={handleGenerateCustom}>
            <div className="grid gap-2">
              <Label htmlFor="custom-situation-input">Situation</Label>
              <Textarea
                id="custom-situation-input"
                value={customSituation}
                onChange={(event) => setCustomSituation(event.target.value)}
                placeholder="A startup screens resumes with an AI filter; given a flagged candidate, what's the chance they're truly a strong fit?"
                rows={5}
                disabled={isGeneratingCustom}
                required
              />
            </div>
            {customError ? (
              <p className="text-sm text-destructive">{customError}</p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isGeneratingCustom}>
                Cancel
              </AlertDialogCancel>
              <Button type="submit" disabled={isGeneratingCustom}>
                {isGeneratingCustom ? "Generating..." : "Generate"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
