"use client"

import * as React from "react"

import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"

type MdeMode = "absolute" | "relative"

type CalculatorState = {
  baselinePercent: number
  mdePercent: number
  mdeMode: MdeMode
  powerPercent: number
  alphaPercent: number
}

type PercentSliderConfig = {
  key: string
  label: string
  min: number
  max: number
  step: number
  value: number
  onValueChange: (value: number) => void
  formatValue: (value: number) => string
}

const MIN_PROBABILITY = 1e-6
const MAX_PROBABILITY = 1 - MIN_PROBABILITY
const PERCENT_INPUT_MIN = 0.01
const PERCENT_INPUT_MAX = 99.99
const POWER_MIN = 50
const POWER_MAX = 99
const ALPHA_MIN = 0.1
const ALPHA_MAX = 20

const DEFAULT_STATE: CalculatorState = {
  baselinePercent: 20,
  mdePercent: 10,
  mdeMode: "relative",
  powerPercent: 80,
  alphaPercent: 5,
}

const MDE_MODES: Array<{ value: MdeMode; label: string }> = [
  { value: "absolute", label: "Absolute" },
  { value: "relative", label: "Relative" },
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

function inverseNormalCdf(p: number): number {
  // Acklam's approximation for the inverse standard normal CDF.
  const a = [
    -39.69683028665376,
    220.9460984245205,
    -275.9285104469687,
    138.357751867269,
    -30.66479806614716,
    2.506628277459239,
  ]
  const b = [
    -54.47609879822406,
    161.5858368580409,
    -155.6989798598866,
    66.80131188771972,
    -13.28068155288572,
  ]
  const c = [
    -0.007784894002430293,
    -0.3223964580411365,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ]
  const d = [
    0.007784695709041462,
    0.3224671290700398,
    2.445134137142996,
    3.754408661907416,
  ]

  const probability = clamp(p, MIN_PROBABILITY, MAX_PROBABILITY)
  const pLow = 0.02425
  const pHigh = 1 - pLow

  if (probability < pLow) {
    const q = Math.sqrt(-2 * Math.log(probability))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }

  if (probability > pHigh) {
    const q = Math.sqrt(-2 * Math.log(1 - probability))
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }

  const q = probability - 0.5
  const r = q * q
  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q
  ) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 100) / 100
  return `${rounded.toLocaleString()}%`
}

function parseNumberInput(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function normalizeInputValue(value: number): string {
  return String(value)
}

function calculateSampleSize(state: CalculatorState): number {
  const baseline = clamp(
    state.baselinePercent / 100,
    MIN_PROBABILITY,
    MAX_PROBABILITY
  )
  const alpha = clamp(state.alphaPercent / 100, MIN_PROBABILITY, 0.5)
  const power = clamp(state.powerPercent / 100, 0.5, MAX_PROBABILITY)
  const zAlpha = inverseNormalCdf(1 - alpha / 2)
  const zPower = inverseNormalCdf(power)

  const bounds = calculateBounds(state)
  const alternatives = [
    clamp(bounds.lower / 100, MIN_PROBABILITY, MAX_PROBABILITY),
    clamp(bounds.upper / 100, MIN_PROBABILITY, MAX_PROBABILITY),
  ]

  let required = 1
  for (const alt of alternatives) {
    const delta = Math.abs(alt - baseline)
    if (delta < MIN_PROBABILITY) {
      continue
    }

    const nullStd = Math.sqrt(2 * baseline * (1 - baseline))
    const altStd = Math.sqrt(baseline * (1 - baseline) + alt * (1 - alt))
    const n = (zAlpha * nullStd + zPower * altStd) ** 2 / delta ** 2
    required = Math.max(required, Math.max(1, Math.round(n)))
  }

  return required
}

function calculateBounds(state: CalculatorState): {
  lower: number
  upper: number
} {
  const baseline = clamp(
    state.baselinePercent / 100,
    MIN_PROBABILITY,
    MAX_PROBABILITY
  )
  if (state.mdeMode === "absolute") {
    const delta = state.mdePercent / 100
    return {
      lower: clamp((baseline - delta) * 100, 0, 100),
      upper: clamp((baseline + delta) * 100, 0, 100),
    }
  }

  const multiplier = state.mdePercent / 100
  return {
    lower: clamp(baseline * (1 - multiplier) * 100, 0, 100),
    upper: clamp(baseline * (1 + multiplier) * 100, 0, 100),
  }
}

function PercentField({
  id,
  label,
  value,
  onValueChange,
  onCommit,
}: {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  onCommit: () => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
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
        <span className="text-sm text-muted-foreground">%</span>
      </div>
    </div>
  )
}

function PercentSliderRow({
  label,
  min,
  max,
  step,
  value,
  onValueChange,
  formatValue,
}: PercentSliderConfig) {
  return (
    <div className="grid gap-3 md:grid-cols-[260px_1fr_76px] md:items-center">
      <Label>{label}</Label>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={(next) => onValueChange(clamp(next, min, max))}
      />
      <p className="text-right">{formatValue(value)}</p>
    </div>
  )
}

export default function SampleSizeCalculatorPage() {
  const [state, setState] = React.useState<CalculatorState>(DEFAULT_STATE)
  const [baselineInput, setBaselineInput] = React.useState(
    normalizeInputValue(DEFAULT_STATE.baselinePercent)
  )
  const [mdeInput, setMdeInput] = React.useState(
    normalizeInputValue(DEFAULT_STATE.mdePercent)
  )

  const sampleSize = React.useMemo(() => calculateSampleSize(state), [state])
  const bounds = React.useMemo(() => calculateBounds(state), [state])

  const commitPercentInput = React.useCallback(
    ({
      input,
      fallback,
      setInput,
      onCommit,
    }: {
      input: string
      fallback: number
      setInput: (value: string) => void
      onCommit: (value: number) => void
    }) => {
      const parsed = parseNumberInput(input)
      if (parsed === null) {
        setInput(normalizeInputValue(fallback))
        return
      }

      const next = clamp(parsed, PERCENT_INPUT_MIN, PERCENT_INPUT_MAX)
      onCommit(next)
      setInput(normalizeInputValue(next))
    },
    []
  )

  const commitBaseline = React.useCallback(() => {
    commitPercentInput({
      input: baselineInput,
      fallback: state.baselinePercent,
      setInput: setBaselineInput,
      onCommit: (value) =>
        setState((prev) => ({ ...prev, baselinePercent: value })),
    })
  }, [baselineInput, commitPercentInput, state.baselinePercent])

  const commitMde = React.useCallback(() => {
    commitPercentInput({
      input: mdeInput,
      fallback: state.mdePercent,
      setInput: setMdeInput,
      onCommit: (value) => setState((prev) => ({ ...prev, mdePercent: value })),
    })
  }, [commitPercentInput, mdeInput, state.mdePercent])

  const percentSliders: PercentSliderConfig[] = [
    {
      key: "power",
      label: "Statistical power 1-β",
      min: POWER_MIN,
      max: POWER_MAX,
      step: 1,
      value: state.powerPercent,
      onValueChange: (value) =>
        setState((prev) => ({ ...prev, powerPercent: value })),
      formatValue: (value) => `${Math.round(value)}%`,
    },
    {
      key: "alpha",
      label: "Significance level α",
      min: ALPHA_MIN,
      max: ALPHA_MAX,
      step: 0.1,
      value: state.alphaPercent,
      onValueChange: (value) =>
        setState((prev) => ({ ...prev, alphaPercent: value })),
      formatValue: (value) => `${(Math.round(value * 10) / 10).toFixed(1)}%`,
    },
  ]

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Sample Size Calculator</h1>
            <p className="text-muted-foreground">
              How many subjects are needed for an A/B test?
            </p>
          </div>

          <div className="rounded-md border border-border p-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-5">
                <PercentField
                  id="baseline-rate"
                  label="Baseline conversion rate"
                  value={baselineInput}
                  onValueChange={setBaselineInput}
                  onCommit={commitBaseline}
                />
                <PercentField
                  id="mde"
                  label="Minimum Detectable Effect (MDE)"
                  value={mdeInput}
                  onValueChange={setMdeInput}
                  onCommit={commitMde}
                />
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  {MDE_MODES.map((mode) => (
                    <label key={mode.value} className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="mde-mode"
                        checked={state.mdeMode === mode.value}
                        onChange={() =>
                          setState((prev) => ({ ...prev, mdeMode: mode.value }))
                        }
                      />
                      <span>{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Baseline conversion rate</p>
                  <p className="text-base font-medium">
                    {formatPercent(state.baselinePercent)}
                  </p>
                </div>
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm text-muted-foreground">Detectable conversion range</p>
                  <p className="text-base font-medium">
                    {formatPercent(bounds.lower)} - {formatPercent(bounds.upper)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-4xl font-semibold tracking-tight">
              {sampleSize.toLocaleString()}
            </p>
            <p className="mt-1 text-lg text-muted-foreground">per variation</p>
          </div>

          <div className="space-y-5 rounded-md border border-border p-6">
            {percentSliders.map((slider) => (
              <PercentSliderRow
                key={slider.key}
                label={slider.label}
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.value}
                onValueChange={slider.onValueChange}
                formatValue={slider.formatValue}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
