export type MdeMode = "absolute" | "relative"

export type CalculatorState = {
  baselinePercent: number
  mdePercent: number
  mdeMode: MdeMode
  powerPercent: number
  alphaPercent: number
}

export type SampleSizePoint = { mdePercent: number; sampleSize: number }

const MIN_PROBABILITY = 1e-6
const MAX_PROBABILITY = 1 - MIN_PROBABILITY
export const PERCENT_INPUT_MIN = 0.01
export const PERCENT_INPUT_MAX = 99.99
export const POWER_MIN = 50
export const POWER_MAX = 99
export const ALPHA_MIN = 0.1
export const ALPHA_MAX = 20

export const DEFAULT_STATE: CalculatorState = {
  baselinePercent: 20,
  mdePercent: 10,
  mdeMode: "relative",
  powerPercent: 80,
  alphaPercent: 5,
}

export const MDE_MODES: Array<{ value: MdeMode; label: string }> = [
  { value: "relative", label: "Relative" },
  { value: "absolute", label: "Absolute" },
]

const countFormatter = new Intl.NumberFormat("en-US")

export function formatCount(value: number): string {
  return countFormatter.format(value)
}

export function formatPercent(value: number): string {
  return `${countFormatter.format(Math.round(value * 100) / 100)}%`
}

/** An MDE in the units of its mode: relative percent, or percentage points. */
export function formatMde(value: number, mode: MdeMode): string {
  const rounded = countFormatter.format(Math.round(value * 100) / 100)
  return mode === "relative" ? `${rounded}%` : `${rounded} pp`
}

export function clamp(value: number, min: number, max: number): number {
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

export function parseNumberInput(value: string): number | null {
  const parsed = Number(value)
  if (value.trim() === "" || !Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

/** Acklam's approximation for the inverse standard normal CDF. */
function inverseNormalCdf(p: number): number {
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687,
    138.357751867269, -30.66479806614716, 2.506628277459239,
  ]
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866,
    66.80131188771972, -13.28068155288572,
  ]
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    0.007784695709041462, 0.3224671290700398, 2.445134137142996,
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
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
      q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  )
}

/** The conversion rates, in percent, that sit one MDE either side of the baseline. */
export function calculateBounds(state: CalculatorState): {
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

/**
 * Visitors per variant for a two-sided two-proportion z-test, taking the
 * larger requirement of a move down or up by the MDE.
 */
export function calculateSampleSize(state: CalculatorState): number {
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

/**
 * The largest MDE for which the upper alternative stays a valid conversion
 * rate; past it the upper bound clamps at 100% and the curve stops meaning
 * anything.
 */
function largestMeaningfulMde(state: CalculatorState): number {
  if (state.mdeMode === "absolute") {
    return PERCENT_INPUT_MAX - state.baselinePercent
  }
  return (PERCENT_INPUT_MAX / state.baselinePercent - 1) * 100
}

/**
 * Required sample size across MDEs from half the current value to double it,
 * trimmed where the upper alternative would pass 100%.
 */
export function calculateSampleSizeCurve(
  state: CalculatorState,
  steps = 96
): SampleSizePoint[] {
  const lower = state.mdePercent / 2
  const upper = Math.max(
    state.mdePercent,
    Math.min(state.mdePercent * 2, largestMeaningfulMde(state))
  )

  return Array.from({ length: steps + 1 }, (_, index) => {
    const mdePercent = lower + ((upper - lower) * index) / steps
    return {
      mdePercent,
      sampleSize: calculateSampleSize({ ...state, mdePercent }),
    }
  })
}

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function formatCompactCount(value: number): string {
  return compactFormatter.format(value).toLowerCase()
}
