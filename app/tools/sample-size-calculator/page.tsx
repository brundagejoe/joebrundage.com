"use client"

import * as React from "react"

import { cn } from "@/shared/lib/utils"
import { Caption, Row, Section } from "@/shared/ui/plate"

import { SampleSizeCurveFigure } from "./figures"
import {
  ALPHA_MAX,
  ALPHA_MIN,
  calculateBounds,
  calculateSampleSize,
  calculateSampleSizeCurve,
  clamp,
  DEFAULT_STATE,
  formatCount,
  formatMde,
  formatPercent,
  MDE_MODES,
  parseNumberInput,
  PERCENT_INPUT_MAX,
  PERCENT_INPUT_MIN,
  POWER_MAX,
  POWER_MIN,
  type CalculatorState,
} from "./model"

const railLabel =
  "plate-label text-[0.7rem] font-medium uppercase tracking-[0.08em] opacity-60"

function PercentField({
  id,
  label,
  suffix,
  value,
  onValueChange,
  onCommit,
}: {
  id: string
  label: string
  suffix: string
  value: string
  onValueChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <label
      htmlFor={id}
      className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-current/20 py-1.5 transition-colors has-[:focus]:border-current/70"
    >
      <span className={railLabel}>{label}</span>
      <span className="flex items-baseline gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="plate-data w-[4.5rem] bg-transparent text-right text-[0.95rem] outline-none"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              onCommit()
            }
          }}
        />
        <span className="w-4 text-[0.8rem] opacity-50">{suffix}</span>
      </span>
    </label>
  )
}

function RangeField({
  id,
  label,
  min,
  max,
  step,
  value,
  display,
  onValueChange,
}: {
  id: string
  label: string
  min: number
  max: number
  step: number
  value: number
  display: string
  onValueChange: (value: number) => void
}) {
  return (
    <div className="border-b border-current/20 py-1.5 transition-colors has-[:focus]:border-current/70">
      <label
        htmlFor={id}
        className="grid grid-cols-[1fr_auto] items-baseline gap-3"
      >
        <span className={railLabel}>{label}</span>
        <span className="plate-data pr-5 text-[0.95rem]">{display}</span>
      </label>
      <input
        id={id}
        type="range"
        className="plate-range mt-1"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) =>
          onValueChange(clamp(Number(event.target.value), min, max))
        }
      />
    </div>
  )
}

export default function SampleSizeCalculatorPage() {
  const [state, setState] = React.useState<CalculatorState>(DEFAULT_STATE)
  const [baselineInput, setBaselineInput] = React.useState(
    String(DEFAULT_STATE.baselinePercent)
  )
  const [mdeInput, setMdeInput] = React.useState(
    String(DEFAULT_STATE.mdePercent)
  )

  const sampleSize = React.useMemo(() => calculateSampleSize(state), [state])
  const bounds = React.useMemo(() => calculateBounds(state), [state])
  const curve = React.useMemo(() => calculateSampleSizeCurve(state), [state])

  const commitPercentInput = (
    input: string,
    fallback: number,
    setInput: (value: string) => void,
    onCommit: (value: number) => void
  ) => {
    const parsed = parseNumberInput(input)
    if (parsed === null) {
      setInput(String(fallback))
      return
    }

    const next = clamp(parsed, PERCENT_INPUT_MIN, PERCENT_INPUT_MAX)
    onCommit(next)
    setInput(String(next))
  }

  const commitBaseline = () =>
    commitPercentInput(
      baselineInput,
      state.baselinePercent,
      setBaselineInput,
      (value) => setState((prev) => ({ ...prev, baselinePercent: value }))
    )

  const commitMde = () =>
    commitPercentInput(mdeInput, state.mdePercent, setMdeInput, (value) =>
      setState((prev) => ({ ...prev, mdePercent: value }))
    )

  const curveStart = curve[0]
  const curveEnd = curve[curve.length - 1]

  return (
    <div className="plate min-h-screen bg-background pt-16">
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <div className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-24">
            <p className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
              The test
            </p>
            <div className="mt-3 grid">
              <PercentField
                id="baseline-rate"
                label="Baseline rate"
                suffix="%"
                value={baselineInput}
                onValueChange={setBaselineInput}
                onCommit={commitBaseline}
              />
              <PercentField
                id="mde"
                label="Min. effect"
                suffix={state.mdeMode === "relative" ? "%" : "pp"}
                value={mdeInput}
                onValueChange={setMdeInput}
                onCommit={commitMde}
              />
              <fieldset className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-current/20 py-1.5">
                <legend className="sr-only">Effect is measured as</legend>
                <span className={railLabel} aria-hidden>
                  Effect is
                </span>
                <span className="flex gap-3 pr-5">
                  {MDE_MODES.map((mode) => (
                    <label
                      key={mode.value}
                      className={cn(
                        "cursor-pointer text-[0.9rem] transition-opacity has-[:focus-visible]:underline",
                        state.mdeMode === mode.value
                          ? "underline decoration-current/60 underline-offset-4"
                          : "opacity-45 hover:opacity-80"
                      )}
                    >
                      <input
                        type="radio"
                        name="mde-mode"
                        className="sr-only"
                        checked={state.mdeMode === mode.value}
                        onChange={() =>
                          setState((prev) => ({ ...prev, mdeMode: mode.value }))
                        }
                      />
                      {mode.label.toLowerCase()}
                    </label>
                  ))}
                </span>
              </fieldset>

              <p className="mt-6 plate-label text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                Error rates
              </p>
              <RangeField
                id="power"
                label="Power"
                min={POWER_MIN}
                max={POWER_MAX}
                step={1}
                value={state.powerPercent}
                display={`${Math.round(state.powerPercent)}%`}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, powerPercent: value }))
                }
              />
              <RangeField
                id="alpha"
                label="Significance"
                min={ALPHA_MIN}
                max={ALPHA_MAX}
                step={0.1}
                value={state.alphaPercent}
                display={`${state.alphaPercent.toFixed(1)}%`}
                onValueChange={(value) =>
                  setState((prev) => ({ ...prev, alphaPercent: value }))
                }
              />
            </div>

            <p className="mt-6 text-[0.8rem] leading-relaxed opacity-50">
              A relative effect scales the baseline; an absolute one adds
              percentage points to it.
            </p>
          </div>

          <div className="min-w-0">
            <Row
              note={
                <>
                  Power is the chance the test flags a real effect of this
                  size. Significance is the chance it flags one when there is
                  none.
                </>
              }
            >
              <h1 className="text-[2.4rem] leading-tight">
                Sample Size Calculator
              </h1>
              <p className="mt-4 max-w-[38rem]">
                How many visitors does an A/B test need before it can tell a
                real change in conversion rate from noise? It depends on where
                you start, how small a change you care about, and how often you
                are willing to be wrong in each direction.
              </p>
            </Row>

            <Section>The answer</Section>
            <Row>
              <p className="mt-4 max-w-[38rem] text-[1.5rem] leading-[1.45]">
                Run{" "}
                <span className="plate-figures">{formatCount(sampleSize)}</span>{" "}
                visitors through each variant,{" "}
                <span className="plate-figures">
                  {formatCount(sampleSize * 2)}
                </span>{" "}
                in all. That is enough to detect the conversion rate rising to{" "}
                <span className="plate-figures">
                  {formatPercent(bounds.upper)}
                </span>{" "}
                or falling to{" "}
                <span className="plate-figures">
                  {formatPercent(bounds.lower)}
                </span>
                .
              </p>
            </Row>

            <Section>
              Figure 1 &nbsp;&middot;&nbsp; What a smaller effect costs
            </Section>
            <Row
              note={
                <>
                  The effect enters the formula squared, so halving it roughly
                  quadruples the traffic. Deciding what change is worth
                  detecting is the most expensive choice on this page.
                </>
              }
            >
              <div className="mt-6">
                <SampleSizeCurveFigure
                  points={curve}
                  currentMde={state.mdePercent}
                  currentSampleSize={sampleSize}
                  mode={state.mdeMode}
                />
              </div>
              <Caption>
                Visitors needed per variant as the smallest effect worth
                detecting runs from {formatMde(curveStart.mdePercent, state.mdeMode)}{" "}
                to {formatMde(curveEnd.mdePercent, state.mdeMode)}, with power
                and significance held where you set them. Detecting{" "}
                {formatMde(curveStart.mdePercent, state.mdeMode)} takes{" "}
                {formatCount(curveStart.sampleSize)} per variant;{" "}
                {formatMde(curveEnd.mdePercent, state.mdeMode)} takes{" "}
                {formatCount(curveEnd.sampleSize)}. The dot is your setting.
              </Caption>
            </Row>

            <Section>Method</Section>
            <Row>
              <p className="mt-4 max-w-[38rem] text-[0.9rem] leading-relaxed opacity-70">
                A two-sided test of two proportions under the normal
                approximation. The page sizes the test for a move up and a move
                down by the same effect and reports the larger of the two, since
                near 0% or 100% the variance is not symmetric.
              </p>
            </Row>
          </div>
        </div>
      </div>
    </div>
  )
}
