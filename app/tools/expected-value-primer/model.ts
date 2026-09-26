export type BuiltInExampleKey = "coinflip" | "insurance"
export type ExampleKey = BuiltInExampleKey | "custom"

export type ExampleConfig = {
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

export type Result = {
  probability: number
  successOutcome: number
  failureOutcome: number
  expectedValue: number
}

export type CustomGenerationResponse = {
  title: string
  description: string
  probabilityLabel: string
  successLabel: string
  failureLabel: string
  probabilityPercent: number
  successOutcome: number
  failureOutcome: number
}

export const EXAMPLES: ExampleConfig[] = [
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

export function parseInput(value: string): number | null {
  if (value.trim() === "") {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

/** Snaps a probability to the 0.1-point grid the slider moves on. */
export function toSliderPercent(value: number): number {
  return Math.round(clamp(value, 0, 100) * 10) / 10
}

export function calculateExpectedValue({
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

/** Standard deviation of a single decision's payoff. */
export function payoffStandardDeviation(result: Result): number {
  return (
    Math.abs(result.successOutcome - result.failureOutcome) *
    Math.sqrt(result.probability * (1 - result.probability))
  )
}

function hasCents(value: number): boolean {
  return Math.abs(Math.round(value * 100) - Math.round(value) * 100) > 0
}

export function formatCurrency(value: number): string {
  const digits = hasCents(value) ? 2 : 0
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value))
}

export function signedCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : ""
  return `${sign}${formatCurrency(rounded)}`
}

export function compactCurrency(value: number): string {
  const sign = value < 0 ? "−" : ""
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(value) >= 10_000 ? "compact" : "standard",
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.abs(value) >= 10 || !hasCents(value) ? 0 : 2,
  }).format(Math.abs(value))
  return `${sign}${formatted}`
}

export function formatPercent(probability: number): string {
  const points = Math.round(probability * 1000) / 10
  return `${Number.isInteger(points) ? points : points.toFixed(1)}%`
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SIMULATED_RUNS = 8

export type LongRun = {
  decisions: number
  runs: number[][]
  expectedTotal: number
  bandHalfWidth: number
  runsBehind: number
}

/**
 * Cumulative totals for a fixed set of seeded runs. Each run draws its
 * uniforms from its own stream, so moving the probability slider shifts the
 * same runs rather than drawing new ones.
 */
export function simulateLongRun(result: Result, decisions: number): LongRun {
  const runs = Array.from({ length: SIMULATED_RUNS }, (_, runIndex) => {
    const random = mulberry32(7919 * (runIndex + 1))
    const totals = [0]
    let total = 0
    for (let step = 0; step < decisions; step += 1) {
      total +=
        random() < result.probability
          ? result.successOutcome
          : result.failureOutcome
      totals.push(total)
    }
    return totals
  })

  return {
    decisions,
    runs,
    expectedTotal: result.expectedValue * decisions,
    bandHalfWidth: 2 * payoffStandardDeviation(result) * Math.sqrt(decisions),
    runsBehind: runs.filter((totals) => totals[decisions] < 0).length,
  }
}
