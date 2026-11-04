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
import { AiFeatureGateButton } from "@/features/ai-feature-gate"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { Caption, ProbabilityStrip, Row, Section } from "@/shared/ui/plate"
import { Textarea } from "@/shared/ui/textarea"
import { useCustomScenarioGeneration } from "@/shared/lib/ai"

import { FrequencyFigure, PriorSweepFigure } from "./figures"
import { BayesRuleFormula, EvidenceFormula } from "./math"
import {
  calculatePosterior,
  customExampleFromResponse,
  EXAMPLES,
  formatCount,
  formatPercent,
  formatShortPercent,
  inputsFromExample,
  parsePercentInput,
  populationCounts,
  POPULATION,
  sweepPriors,
  validateInputs,
  type CustomGenerationResponse,
  type ExampleConfig,
  type ExampleKey,
  type Inputs,
  type Result,
} from "./model"

function PercentControl({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (next: string) => void
}) {
  const parsed = parsePercentInput(value)
  const sliderValue = parsed === null ? 0 : Math.min(Math.max(parsed, 0), 100)

  return (
    <div className="grid content-start gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70"
        >
          {label}
        </label>
        <span className="plate-data flex items-baseline text-[0.94rem]">
          <input
            id={id}
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-describedby={`${id}-hint`}
            className="w-11 border-b border-current/20 bg-transparent text-right outline-none focus:border-current/70"
            required
          />
          <span className="ml-0.5 opacity-60">%</span>
        </span>
      </div>
      <input
        type="range"
        className="plate-range"
        aria-label={label}
        min={0}
        max={100}
        step={0.1}
        value={sliderValue}
        onChange={(event) => onChange(event.target.value)}
      />
      <p id={`${id}-hint`} className="text-[0.85em] leading-snug opacity-60">
        {hint}
      </p>
    </div>
  )
}

function ControlStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 grid gap-x-8 gap-y-5 border-t border-current/20 pt-4 sm:grid-cols-3">
      {children}
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[35em] space-y-4">{children}</div>
}

function countNoun(value: number, noun: string): string {
  return `${formatCount(value)} ${noun}${Math.round(value) === 1 ? "" : "s"}`
}

function Term({ children }: { children: React.ReactNode }) {
  return <span className="italic">{children}</span>
}

type BayesPrimerClientProps = {
  canUseAiCustom: boolean
}

export function BayesPrimerClient({ canUseAiCustom }: BayesPrimerClientProps) {
  const [activeExample, setActiveExample] =
    React.useState<ExampleKey>("medical")
  const [customExample, setCustomExample] =
    React.useState<ExampleConfig | null>(null)
  const [inputs, setInputs] = React.useState<Inputs>(() =>
    inputsFromExample(EXAMPLES[0])
  )
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<Result>(() =>
    calculatePosterior(EXAMPLES[0])
  )

  const customGeneration =
    useCustomScenarioGeneration<CustomGenerationResponse>({
      endpoint: "/api/tools/bayes-primer/custom",
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
    setInputs(inputsFromExample(example))
    setError(null)
    setResult(calculatePosterior(example))
  }

  const handleInputChange = (field: keyof Inputs) => (next: string) => {
    const nextInputs = { ...inputs, [field]: next }
    setInputs(nextInputs)

    const validated = validateInputs(nextInputs)
    if (validated.ok) {
      setError(null)
      setResult(validated.result)
    } else {
      setError(validated.error)
    }
  }

  const handleGenerateCustom = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    try {
      const data = await customGeneration.submit()
      const generatedExample = customExampleFromResponse(data)

      setCustomExample(generatedExample)
      handleLoadExample(generatedExample)
    } catch (error) {
      void error
    }
  }

  const counts = populationCounts(result)
  const sweep = React.useMemo(
    () => sweepPriors(result.likelihood, result.falsePositive),
    [result.likelihood, result.falsePositive]
  )
  const oneIn =
    counts.truePositives > 0
      ? counts.positives / counts.truePositives
      : Infinity
  const likelihoodRatio = result.likelihood / result.falsePositive

  return (
    <div className="min-h-screen bg-background pt-16">
      <article className="mx-auto max-w-[64rem] px-6 py-10">
        <Row
          note={
            <>
              The figures follow the numbers under them. Type a value or drag
              its slider and every figure and sentence on the page updates.
            </>
          }
        >
          <p className="plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
            Tools
          </p>
          <h1 className="mt-3 text-[1.9rem] leading-tight">Bayes Primer</h1>
          <p className="mt-4 max-w-[35em]">
            Start with a prior belief, observe evidence, and let Bayes’ rule
            update the belief. In the {selectedExample.title.toLowerCase()}{" "}
            scenario, seeing the evidence moves the chance of <Term>H</Term>{" "}
            from{" "}
            <span className="plate-figures">{formatPercent(result.prior)}</span>{" "}
            to{" "}
            <span className="whitespace-nowrap">
              <span className="plate-figures">
                {formatPercent(result.posterior)}
              </span>
              <ProbabilityStrip
                probability={result.posterior}
                threshold={result.prior}
              />
              .
            </span>
          </p>
        </Row>

        <Section>Scenario</Section>
        <Row
          note={
            <>
              Custom asks a language model to write the three questions and
              starting numbers for a situation you describe.
            </>
          }
        >
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example.key}
                type="button"
                size="sm"
                variant={activeExample === example.key ? "default" : "outline"}
                aria-pressed={activeExample === example.key}
                className={
                  activeExample === example.key ? "border-current" : undefined
                }
                onClick={() => handleLoadExample(example)}
              >
                {example.title}
              </Button>
            ))}
            <AiFeatureGateButton
              size="sm"
              variant={activeExample === "custom" ? "default" : "outline"}
              aria-pressed={activeExample === "custom"}
              className={
                activeExample === "custom" ? "border-current" : undefined
              }
              canUseAi={canUseAiCustom}
              onAllowedClick={customGeneration.openDialog}
              featureLabel="custom Bayes scenarios"
            >
              {customExample?.title || "Custom"}
            </AiFeatureGateButton>
          </div>
          <p className="mt-4 max-w-[35em]">{selectedExample.description}</p>
        </Row>

        <Section>Ten thousand cases</Section>
        <Row
          note={
            <>
              Counting cases instead of multiplying probabilities is the whole
              trick. The tick on the middle bar marks where <Term>H</Term> ends,
              so each kind of positive stays under the group it came from.
            </>
          }
        >
          <Prose>
            <p className="mt-4">
              Picture {formatCount(POPULATION)} cases. Some fraction have{" "}
              <Term>H</Term>, the thing you care about. The evidence shows up
              often among those cases and, if it is any good, rarely among the
              rest. After you see it, only the cases that show it are still in
              play.
            </p>
          </Prose>
          <div className="mt-8">
            <div className="hidden sm:block">
              <FrequencyFigure result={result} />
            </div>
            <div className="sm:hidden">
              <FrequencyFigure result={result} width={380} />
            </div>
          </div>
          <ControlStrip>
            <PercentControl
              id="prior-input"
              label="Prior P(H)"
              hint={selectedExample.priorLabel}
              value={inputs.priorPercent}
              onChange={handleInputChange("priorPercent")}
            />
            <PercentControl
              id="true-positive-input"
              label="Hit rate P(E|H)"
              hint={selectedExample.likelihoodLabel}
              value={inputs.truePositivePercent}
              onChange={handleInputChange("truePositivePercent")}
            />
            <PercentControl
              id="false-positive-input"
              label="False alarm P(E|¬H)"
              hint={selectedExample.falsePositiveLabel}
              value={inputs.falsePositivePercent}
              onChange={handleInputChange("falsePositivePercent")}
            />
          </ControlStrip>
          {error ? (
            <p role="alert" className="mt-3 text-[0.9em] text-destructive">
              {error}
            </p>
          ) : null}
          <Caption>
            The top bar splits the cases by <Term>H</Term>; the middle keeps
            only those that show the evidence. The{" "}
            {countNoun(counts.falseNegatives, "false negative")} and{" "}
            {countNoun(counts.trueNegatives, "true negative")} drop out. The
            bottom bar stretches the survivors back to full width, and its dark
            share is the posterior:{" "}
            {Number.isFinite(oneIn)
              ? `about 1 in ${oneIn < 10 ? oneIn.toFixed(1) : formatCount(oneIn)} positives actually has H.`
              : "no positive has H."}
          </Caption>
        </Row>

        <Section>The rule</Section>
        <Row
          note={
            <>
              <Term>P(E)</Term> is the middle bar’s filled length as a share of
              the whole bar: everyone who shows the evidence, with or without{" "}
              <Term>H</Term>.
            </>
          }
        >
          <Prose>
            <p className="mt-4">
              The bottom bar is Bayes’ rule drawn to scale. The posterior is the
              true positives divided by everyone who shows the evidence:
            </p>
          </Prose>
          <BayesRuleFormula />
          <Prose>
            <p>
              The denominator counts both kinds of positive, those with{" "}
              <Term>H</Term> and those without:
            </p>
          </Prose>
          <EvidenceFormula />
          <Prose>
            <p>
              Here that comes to{" "}
              <span className="plate-figures">
                {formatPercent(result.evidence)}
              </span>
              . A rare <Term>H</Term> makes the second term large even when the
              false positive rate is small, which is why a good test for a rare
              condition still raises many false alarms.
            </p>
          </Prose>
        </Row>

        <Section>How much the prior matters</Section>
        <Row
          note={
            <>
              When <Term>P(E|H)</Term> is below <Term>P(E|¬H)</Term>, the
              evidence counts against <Term>H</Term> and the curve drops below
              the diagonal.
            </>
          }
        >
          <Prose>
            <p className="mt-4">
              Hold the evidence fixed and vary only the prior. The same evidence
              that barely moves a rare hypothesis can make a common one nearly
              certain.
            </p>
          </Prose>
          <div className="mt-8">
            <div className="hidden sm:block">
              <PriorSweepFigure points={sweep} result={result} />
            </div>
            <div className="sm:hidden">
              <PriorSweepFigure points={sweep} result={result} width={380} />
            </div>
          </div>
          <Caption>
            Posterior against prior for this evidence, which is{" "}
            {likelihoodRatio >= 1
              ? `${likelihoodRatio < 10 ? likelihoodRatio.toFixed(1) : formatCount(likelihoodRatio)} times as likely with H as without`
              : `${(1 / likelihoodRatio).toFixed(1)} times as likely without H as with`}
            . The dashed diagonal is no update at all; the vertical segment is
            how far the evidence moves the current prior of{" "}
            {formatShortPercent(result.prior)}. The prior axis is logarithmic so
            that rare hypotheses, where the base rate matters most, get room.
          </Caption>
        </Row>
      </article>

      <AlertDialog
        open={customGeneration.isDialogOpen}
        onOpenChange={customGeneration.setIsDialogOpen}
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
                placeholder="A startup screens resumes with an AI filter; given a flagged candidate, what’s the chance they’re truly a strong fit?"
                rows={5}
                disabled={customGeneration.isGenerating}
                required
              />
            </div>
            {customGeneration.error ? (
              <p className="text-sm text-destructive">
                {customGeneration.error}
              </p>
            ) : null}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={customGeneration.isGenerating}>
                Cancel
              </AlertDialogCancel>
              <Button type="submit" disabled={customGeneration.isGenerating}>
                {customGeneration.isGenerating ? "Generating…" : "Generate"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
