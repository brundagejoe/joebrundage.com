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
import { AiFeatureGateButton } from "@/shared/ui/ai-feature-gate-button"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { useCustomScenarioGeneration } from "@/shared/lib/ai/use-custom-scenario-generation"

type BuiltInExampleKey = "coinflip" | "insurance"
type ExampleKey = BuiltInExampleKey | "custom"

type ExampleConfig = {
  key: ExampleKey
  title: string
  description: string
  probabilityPercent: number
  successOutcome: number
  failureOutcome: number
  probabilityLabel: string
  successLabel: string
  failureLabel: string
}

type Inputs = {
  probabilityPercent: string
  successOutcome: string
  failureOutcome: string
}

type Result = {
  probability: number
  successOutcome: number
  failureOutcome: number
  expectedValue: number
}

type CustomGenerationResponse = {
  title: string
  description: string
  probabilityLabel: string
  successLabel: string
  failureLabel: string
  probabilityPercent: number
  successOutcome: number
  failureOutcome: number
}

const EXAMPLES: ExampleConfig[] = [
  {
    key: "coinflip",
    title: "Coin flip wager",
    description:
      "You win a small amount on heads and lose a small amount on tails.",
    probabilityPercent: 50,
    successOutcome: 3,
    failureOutcome: -2,
    probabilityLabel: "Probability the favorable outcome occurs.",
    successLabel: "Net gain if the favorable outcome occurs.",
    failureLabel: "Net gain (or loss) if the favorable outcome does not occur.",
  },
  {
    key: "insurance",
    title: "Extended warranty",
    description:
      "Most customers never claim, but rare claims can be expensive.",
    probabilityPercent: 8,
    successOutcome: -400,
    failureOutcome: 120,
    probabilityLabel: "Probability a claim is filed and must be paid.",
    successLabel: "Net gain if a claim happens (usually negative).",
    failureLabel: "Net gain if no claim is filed.",
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

function parseInput(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

function calculateExpectedValue({
  probabilityPercent,
  successOutcome,
  failureOutcome,
}: {
  probabilityPercent: number
  successOutcome: number
  failureOutcome: number
}): Result {
  const probability = clamp(probabilityPercent / 100, 0, 1)
  const expectedValue =
    probability * successOutcome + (1 - probability) * failureOutcome

  return {
    probability,
    successOutcome,
    failureOutcome,
    expectedValue,
  }
}

function getInitialResult(): Result {
  return calculateExpectedValue({
    probabilityPercent: EXAMPLES[0].probabilityPercent,
    successOutcome: EXAMPLES[0].successOutcome,
    failureOutcome: EXAMPLES[0].failureOutcome,
  })
}

type ExpectedValuePrimerClientProps = {
  canUseAiCustom: boolean
}

export function ExpectedValuePrimerClient({
  canUseAiCustom,
}: ExpectedValuePrimerClientProps) {
  const [activeExample, setActiveExample] =
    React.useState<ExampleKey>("coinflip")
  const [customExample, setCustomExample] =
    React.useState<ExampleConfig | null>(null)
  const [inputs, setInputs] = React.useState<Inputs>({
    probabilityPercent: String(EXAMPLES[0].probabilityPercent),
    successOutcome: String(EXAMPLES[0].successOutcome),
    failureOutcome: String(EXAMPLES[0].failureOutcome),
  })
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<Result>(getInitialResult)

  const customGeneration =
    useCustomScenarioGeneration<CustomGenerationResponse>({
      endpoint: "/api/tools/expected-value-primer/custom",
      defaultErrorMessage: "Could not generate a custom scenario.",
    })

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
      probabilityPercent: String(example.probabilityPercent),
      successOutcome: String(example.successOutcome),
      failureOutcome: String(example.failureOutcome),
    })
    setError(null)
    setResult(
      calculateExpectedValue({
        probabilityPercent: example.probabilityPercent,
        successOutcome: example.successOutcome,
        failureOutcome: example.failureOutcome,
      })
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const probabilityPercent = parseInput(inputs.probabilityPercent)
    const successOutcome = parseInput(inputs.successOutcome)
    const failureOutcome = parseInput(inputs.failureOutcome)

    if (
      probabilityPercent === null ||
      successOutcome === null ||
      failureOutcome === null
    ) {
      setError("All fields must be valid numbers.")
      return
    }

    if (probabilityPercent < 0 || probabilityPercent > 100) {
      setError("Probability must be between 0 and 100.")
      return
    }

    setError(null)
    setResult(
      calculateExpectedValue({
        probabilityPercent,
        successOutcome,
        failureOutcome,
      })
    )
  }

  const handleGenerateCustom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    try {
      const data = await customGeneration.submit()
      const generatedExample: ExampleConfig = {
        key: "custom",
        title: String(data.title ?? "Custom"),
        description: String(data.description ?? "Custom scenario"),
        probabilityLabel: String(
          data.probabilityLabel ?? "Probability the favorable outcome occurs."
        ),
        successLabel: String(
          data.successLabel ?? "Net gain if the favorable outcome occurs."
        ),
        failureLabel: String(
          data.failureLabel ??
            "Net gain (or loss) if the favorable outcome does not occur."
        ),
        probabilityPercent: Number(data.probabilityPercent ?? 50),
        successOutcome: Number(data.successOutcome ?? 100),
        failureOutcome: Number(data.failureOutcome ?? -50),
      }

      setCustomExample(generatedExample)
      handleLoadExample(generatedExample)
    } catch (error) {
      void error
    }
  }

  const successContribution = result.probability * result.successOutcome
  const failureContribution = (1 - result.probability) * result.failureOutcome
  const expectedPer100 = result.expectedValue * 100

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-4xl px-6 py-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold">Expected Value Primer</h2>
          <p className="text-muted-foreground leading-relaxed mt-2">
            Estimate the average long-run value of a decision by weighting each
            outcome by its probability.
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
            <AiFeatureGateButton
              variant={activeExample === "custom" ? "default" : "outline"}
              canUseAi={canUseAiCustom}
              onAllowedClick={customGeneration.openDialog}
              featureLabel="custom expected value scenarios"
            >
              {customExample?.title || "Custom"}
            </AiFeatureGateButton>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">
            {selectedExample.description}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="probability-input">Favorable outcome probability %</Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.probabilityLabel}
              </p>
              <Input
                id="probability-input"
                inputMode="decimal"
                value={inputs.probabilityPercent}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    probabilityPercent: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="success-outcome-input">
                Outcome if favorable case happens
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.successLabel}
              </p>
              <Input
                id="success-outcome-input"
                inputMode="decimal"
                value={inputs.successOutcome}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    successOutcome: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="failure-outcome-input">
                Outcome if favorable case does not happen
              </Label>
              <p className="text-xs text-muted-foreground">
                {selectedExample.failureLabel}
              </p>
              <Input
                id="failure-outcome-input"
                inputMode="decimal"
                value={inputs.failureOutcome}
                onChange={(event) =>
                  setInputs((prev) => ({
                    ...prev,
                    failureOutcome: event.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit">Calculate Expected Value</Button>
            </div>
          </form>

          {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

          <div className="mt-6 flex flex-col gap-3 text-sm border-t border-border pt-4">
            <p>
              <span className="font-medium">Favorable probability:</span>{" "}
              {formatPercent(result.probability)}
            </p>
            <p>
              <span className="font-medium">Expected value (per decision):</span>{" "}
              {formatCurrency(result.expectedValue)}
            </p>
            <p>
              <span className="font-medium">Expected value (per 100 decisions):</span>{" "}
              {formatCurrency(expectedPer100)}
            </p>
          </div>

          <div className="mt-6 rounded-md border border-border p-4 text-sm">
            <p className="font-medium">How the calculation works</p>
            <p className="mt-2 text-muted-foreground">
              Expected value = P(success) * Outcome(success) + (1 - P(success)) *
              Outcome(failure)
            </p>
            <p className="mt-2 text-muted-foreground">
              Success contribution: {formatCurrency(successContribution)}
            </p>
            <p className="mt-1 text-muted-foreground">
              Failure contribution: {formatCurrency(failureContribution)}
            </p>
            <p className="mt-1">
              Combined average:{" "}
              <span className="font-medium">
                {formatCurrency(result.expectedValue)}
              </span>
            </p>
          </div>
        </div>
      </section>

      <AlertDialog
        open={customGeneration.isDialogOpen}
        onOpenChange={customGeneration.setIsDialogOpen}
      >
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Create Custom EV Scenario</AlertDialogTitle>
            <AlertDialogDescription>
              Describe your situation and we will generate context-specific
              expected value labels and starter values.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form className="grid gap-4" onSubmit={handleGenerateCustom}>
            <div className="grid gap-2">
              <Label htmlFor="custom-situation-input">Situation</Label>
              <Textarea
                id="custom-situation-input"
                value={customGeneration.situation}
                onChange={(event) =>
                  customGeneration.setSituation(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault()
                    event.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="We can spend $2,000 on a webinar. If it succeeds, expected net gain is $9,000; if not, we lose the spend. What's the expected value?"
                rows={5}
                disabled={customGeneration.isGenerating}
                required
              />
            </div>
            {customGeneration.error ? (
              <p className="text-sm text-destructive">{customGeneration.error}</p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={customGeneration.isGenerating}>
                Cancel
              </AlertDialogCancel>
              <Button type="submit" disabled={customGeneration.isGenerating}>
                {customGeneration.isGenerating ? "Generating..." : "Generate"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
