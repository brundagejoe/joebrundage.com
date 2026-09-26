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
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Caption, Row, Section } from "@/shared/ui/plate"
import { Textarea } from "@/shared/ui/textarea"
import { useCustomScenarioGeneration } from "@/shared/lib/ai"

import { LongRunFigure, OutcomeBalanceFigure } from "./figures"
import {
  ExpectedValueFormula,
  InlineMath,
  StandardDeviationFormula,
} from "./math"
import {
  calculateExpectedValue,
  EXAMPLES,
  formatCurrency,
  formatPercent,
  parseInput,
  payoffStandardDeviation,
  signedCurrency,
  simulateLongRun,
  SIMULATED_RUNS,
  toSliderPercent,
  type CustomGenerationResponse,
  type ExampleConfig,
  type ExampleKey,
} from "./model"

type Inputs = {
  successOutcome: string
  failureOutcome: string
}

type Outcomes = {
  successOutcome: number
  failureOutcome: number
}

const NUMBER_WORDS = [
  "none",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
]

function ControlLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.1em] opacity-60"
    >
      {children}
    </label>
  )
}

function ControlHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.84rem] leading-snug opacity-55">{children}</p>
}

function RangeControl({
  id,
  label,
  display,
  hint,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string
  label: string
  display: string
  hint?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="grid content-start gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <ControlLabel htmlFor={id}>{label}</ControlLabel>
        <span className="plate-data text-[0.85rem]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className="plate-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint ? <ControlHint>{hint}</ControlHint> : null}
    </div>
  )
}

function AmountControl({
  id,
  label,
  hint,
  value,
  invalid,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  invalid: boolean
  onChange: (next: string) => void
}) {
  return (
    <div className="grid content-start gap-1">
      <ControlLabel htmlFor={id}>{label}</ControlLabel>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
        className="h-8"
      />
      <ControlHint>{hint}</ControlHint>
    </div>
  )
}

function ControlStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-current/20 pt-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[38rem] space-y-4">{children}</div>
}

function Aside({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <>
      <h3 className="mt-10 text-[1.35rem]">{title}</h3>
      <div className="mt-3 max-w-[38rem] space-y-4">{children}</div>
    </>
  )
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
  const [probabilityPercent, setProbabilityPercent] = React.useState(
    EXAMPLES[0].probabilityPercent
  )
  const [inputs, setInputs] = React.useState<Inputs>({
    successOutcome: String(EXAMPLES[0].successOutcome),
    failureOutcome: String(EXAMPLES[0].failureOutcome),
  })
  const [outcomes, setOutcomes] = React.useState<Outcomes>({
    successOutcome: EXAMPLES[0].successOutcome,
    failureOutcome: EXAMPLES[0].failureOutcome,
  })
  const [decisions, setDecisions] = React.useState(100)

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

  const result = React.useMemo(
    () => calculateExpectedValue({ probabilityPercent, ...outcomes }),
    [probabilityPercent, outcomes]
  )
  const longRun = React.useMemo(
    () => simulateLongRun(result, decisions),
    [result, decisions]
  )

  const successInvalid = parseInput(inputs.successOutcome) === null
  const failureInvalid = parseInput(inputs.failureOutcome) === null
  const error =
    successInvalid || failureInvalid
      ? "Both payoffs must be valid numbers. The figures show the last valid values."
      : null

  const handleLoadExample = (example: ExampleConfig) => {
    setActiveExample(example.key)
    setProbabilityPercent(toSliderPercent(example.probabilityPercent))
    setInputs({
      successOutcome: String(example.successOutcome),
      failureOutcome: String(example.failureOutcome),
    })
    setOutcomes({
      successOutcome: example.successOutcome,
      failureOutcome: example.failureOutcome,
    })
  }

  const handleOutcomeChange = (key: keyof Inputs, value: string) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
    const parsed = parseInput(value)
    if (parsed !== null) {
      setOutcomes((prev) => ({ ...prev, [key]: parsed }))
    }
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
  const verdict =
    Math.round(result.expectedValue * 100) > 0
      ? "on the gain side of zero: on average this decision makes money"
      : Math.round(result.expectedValue * 100) < 0
        ? "on the loss side of zero: on average this decision costs money"
        : "at zero: on average this decision breaks even"
  const sigma = payoffStandardDeviation(result)

  return (
    <div className="plate min-h-screen bg-background pt-16">
      <article className="mx-auto max-w-[64rem] px-6 py-10">
        <Row
          note={
            <>
              Pick a scenario, then move the controls under either figure and
              watch what changes.
            </>
          }
        >
          <p className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
            EVP
          </p>
          <h1 className="mt-3 text-[2.4rem] leading-tight">
            Expected Value Primer
          </h1>
          <p className="mt-4 max-w-[38rem]">
            Estimate the average long-run value of a decision by weighting each
            outcome by its probability. One number summarizes the bet; a second
            figure shows what that number does and does not promise.
          </p>
        </Row>

        <Section>Section 1 &nbsp;&middot;&nbsp; The scenario</Section>
        <Row
          note={
            canUseAiCustom ? (
              <>
                Custom describes your own situation and writes the labels and
                starting numbers for it.
              </>
            ) : (
              <>
                Custom scenarios are generated from a description of your
                situation and need an eligible account.
              </>
            )
          }
        >
          <h2 className="mt-4 text-[1.6rem]">A decision with two outcomes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <Button
                key={example.key}
                type="button"
                variant={activeExample === example.key ? "default" : "outline"}
                aria-pressed={activeExample === example.key}
                onClick={() => handleLoadExample(example)}
              >
                {example.title}
              </Button>
            ))}
            <AiFeatureGateButton
              variant={activeExample === "custom" ? "default" : "outline"}
              aria-pressed={activeExample === "custom"}
              canUseAi={canUseAiCustom}
              onAllowedClick={customGeneration.openDialog}
              featureLabel="custom expected value scenarios"
            >
              {customExample?.title || "Custom"}
            </AiFeatureGateButton>
          </div>
          <p className="mt-4 max-w-[38rem]">{selectedExample.description}</p>
        </Row>

        <Section>Section 2 &nbsp;&middot;&nbsp; Weighing the outcomes</Section>
        <Row
          note={
            <>
              With more than two outcomes the rule is the same: multiply each
              payoff by its probability and add them all up.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">The balance point</h2>
          <Prose>
            <p>
              Expected value weights each outcome by its chance of happening
              and adds the results:
            </p>
          </Prose>
          <ExpectedValueFormula />
          <Prose>
            <p>
              where <InlineMath>p</InlineMath> is the probability that the event
              happens, <InlineMath>x₁</InlineMath> is the payoff if it does, and{" "}
              <InlineMath>x₂</InlineMath> is the payoff if it does not. Picture
              each payoff as a weight on a beam, as heavy as its probability.
              The expected value is the point where the beam balances.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              Drag the probability and the balance point slides toward the
              outcome that grows more likely.
            </>
          }
        >
          <div className="mt-8">
            <OutcomeBalanceFigure result={result} />
          </div>
          <ControlStrip>
            <RangeControl
              id="probability-input"
              label="Probability it happens"
              display={formatPercent(result.probability)}
              hint={selectedExample.probabilityLabel}
              min={0}
              max={100}
              step={0.1}
              value={probabilityPercent}
              onChange={setProbabilityPercent}
            />
            <AmountControl
              id="success-outcome-input"
              label="Payoff if it happens"
              hint={selectedExample.successLabel}
              value={inputs.successOutcome}
              invalid={successInvalid}
              onChange={(value) => handleOutcomeChange("successOutcome", value)}
            />
            <AmountControl
              id="failure-outcome-input"
              label="Payoff if not"
              hint={selectedExample.failureLabel}
              value={inputs.failureOutcome}
              invalid={failureInvalid}
              onChange={(value) => handleOutcomeChange("failureOutcome", value)}
            />
          </ControlStrip>
          {error ? (
            <p className="mt-3 text-[0.9rem] text-destructive">{error}</p>
          ) : null}
          <Caption>
            Each payoff stands at its place on the value axis, as tall as its
            probability. Weighted, the first contributes{" "}
            <span className="plate-figures">
              {signedCurrency(successContribution)}
            </span>{" "}
            and the second{" "}
            <span className="plate-figures">
              {signedCurrency(failureContribution)}
            </span>
            , and their sum puts the balance point, marked by the triangle,{" "}
            {verdict}.
          </Caption>
        </Row>

        <Section>Section 3 &nbsp;&middot;&nbsp; The long run</Section>
        <Row
          note={
            <>
              The runs share their random draws, so moving the probability
              nudges the same eight runs rather than drawing new ones.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">An average needs repetitions</h2>
          <Prose>
            <p>
              Expected value is a promise about the average, not about any
              single outcome. One decision pays one payoff or the other, never
              the expected value itself. Repeat the decision, though, and the
              running total starts to track the expected value times the number
              of decisions made.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              Set the horizon to 100 to read the expected value per hundred
              decisions off the end of the solid line.
            </>
          }
        >
          <div className="mt-8">
            <LongRunFigure longRun={longRun} />
          </div>
          <ControlStrip>
            <RangeControl
              id="decisions-input"
              label="Decisions"
              display={new Intl.NumberFormat("en-US").format(decisions)}
              min={10}
              max={1000}
              step={10}
              value={decisions}
              onChange={setDecisions}
            />
          </ControlStrip>
          <Caption>
            Faint lines are {NUMBER_WORDS[SIMULATED_RUNS]} simulated runs; the
            solid line is the expected total, rising by the expected value with
            every decision. The shaded band, two standard deviations either
            side, ends between{" "}
            <span className="plate-figures">
              {signedCurrency(longRun.expectedTotal - longRun.bandHalfWidth)}
            </span>{" "}
            and{" "}
            <span className="plate-figures">
              {signedCurrency(longRun.expectedTotal + longRun.bandHalfWidth)}
            </span>
            , and {NUMBER_WORDS[longRun.runsBehind]} of the runs finished below
            zero. The band widens with the square root of the number of
            decisions while the expected total grows in proportion to it, so
            the average wins out only when the decision repeats.
          </Caption>
        </Row>

        <Section>Section 4 &nbsp;&middot;&nbsp; Beyond the average</Section>
        <Row
          note={
            <>
              The same numbers read differently from the other side of the
              deal. A warranty seller writes thousands of contracts and gets the
              long run; a buyer holds one and gets a single draw.
            </>
          }
        >
          <Aside title="When the average is not enough">
            <p>
              Two decisions with the same expected value can feel nothing alike.
              What separates them is spread, measured by the standard deviation
              of a single payoff:
            </p>
          </Aside>
          <StandardDeviationFormula />
          <Prose>
            <p>
              For the current scenario that comes to{" "}
              <span className="plate-figures">{formatCurrency(sigma)}</span> per
              decision. When the spread is large next to the expected value, or
              when you only get to make the decision once, the average is a poor
              guide to what will actually happen. That is why people buy
              insurance with a negative expected value: they are paying to give
              up the spread, not misreading the average.
            </p>
          </Prose>
        </Row>
      </article>

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
