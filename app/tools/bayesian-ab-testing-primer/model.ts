export type BetaChartPoint = {
  probability: number
  density: number
}

export type ChartRange<TPoint> = {
  maxDensity: number
  points: TPoint[]
}

export type OverlayChartPoint = {
  probability: number
  n100: number
  n500: number
  n2000: number
}

export type AbChartPoint = {
  probability: number
  control: number
  variant: number
}

export type AbComparisonResult = {
  points: AbChartPoint[]
  maxDensity: number
  probBBeatsA: number
}

export type LossCurvePoint = {
  n: number
  lossChooseA: number
  lossChooseB: number
}
export const WORKED_EXAMPLE_WEEKS = [
  { week: 1, nPerVariant: 250,  controlSuccesses: 9,  variantSuccesses: 22 },
  { week: 2, nPerVariant: 500,  controlSuccesses: 27, variantSuccesses: 33 },
  { week: 3, nPerVariant: 750,  controlSuccesses: 46, variantSuccesses: 43 },
  { week: 4, nPerVariant: 1000, controlSuccesses: 60, variantSuccesses: 57 },
  { week: 5, nPerVariant: 1250, controlSuccesses: 72, variantSuccesses: 76 },
  { week: 6, nPerVariant: 1500, controlSuccesses: 84, variantSuccesses: 93 },
] as const

export const EXAMPLE_NARRATIVES = [
  {
    heading: "Week 1 — B jumps out early",
    body: "Only 250 users per side and B is already sitting well to the right of A's posterior. P(B > A) is high and Loss_B is the smaller loss. The math favors shipping B — but the posteriors are still very wide. Notice how elevated both losses are in absolute terms. This is a signal that the data is thin, not that B is proven.",
  },
  {
    heading: "Week 2 — B holds the lead",
    body: "More data, tighter curves. B is still to the right of A and Loss_B is still smaller. The early signal is holding up. The math still says ship B — but both losses remain above what a conservative threshold would require. It is still plausible that this is variance.",
  },
  {
    heading: "Week 3 — A overtakes",
    body: "The posteriors have crossed. A's curve now sits to the right of B's. The week-1 spike for B was noise — A has caught up and moved ahead cumulatively. Loss_A is now the smaller number. The recommendation has flipped. If you had shipped B at week 1, you would now be running the worse variant.",
  },
  {
    heading: "Week 4 — A holds",
    body: "A is still ahead. The posteriors are close together and barely separated, which means both losses are modest. The data is genuinely uncertain here — A is favored but not decisively. Hold with A.",
  },
  {
    heading: "Week 5 — B re-emerges",
    body: "B has moved back to the right. After two weeks of A leading, B's posterior has crossed back over. Loss_B has dropped below Loss_A again. The true underlying signal is starting to assert itself through the noise. Ship B.",
  },
  {
    heading: "Week 6 — the signal settles",
    body: "B's posterior is clearly to the right, the curves are well-separated, and Loss_B is near zero. The accumulated evidence has converged. The early volatility is resolved and B's advantage is now supported by enough data to act on confidently.",
  },
] as const
const LANCZOS_COEFFICIENTS = [
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
]

const CHART_POINTS = 180

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

function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  }

  const shifted = z - 1
  let x = 0.9999999999998099

  for (let index = 0; index < LANCZOS_COEFFICIENTS.length; index += 1) {
    x += LANCZOS_COEFFICIENTS[index] / (shifted + index + 1)
  }

  const t = shifted + LANCZOS_COEFFICIENTS.length - 0.5
  return (
    0.9189385332046727 +
    (shifted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  )
}

function logBeta(alpha: number, beta: number): number {
  return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta)
}

function betaPdf(x: number, alpha: number, beta: number): number {
  const boundedX = clamp(x, 1e-6, 1 - 1e-6)
  return Math.exp(
    (alpha - 1) * Math.log(boundedX) +
      (beta - 1) * Math.log(1 - boundedX) -
      logBeta(alpha, beta)
  )
}

export function createBetaChartData(alpha: number, beta: number): BetaChartPoint[] {
  return Array.from({ length: CHART_POINTS }, (_, index) => {
    const probability = index / (CHART_POINTS - 1)
    const interiorProbability = clamp(probability, 1e-4, 1 - 1e-4)

    return {
      probability,
      density: clamp(betaPdf(interiorProbability, alpha, beta), 0, 12),
    }
  })
}

export function createOverlayBetaChartData(
  series: Array<{ key: keyof OverlayChartPoint; alpha: number; beta: number }>
): ChartRange<OverlayChartPoint> {
  const ranges = series.map(({ alpha, beta }) => {
    const mean = alpha / (alpha + beta)
    const variance =
      (alpha * beta) /
      ((alpha + beta) ** 2 * (alpha + beta + 1))
    const standardDeviation = Math.sqrt(Math.max(variance, 1e-9))
    return {
      mean,
      halfSpan: Math.max(standardDeviation * 4.5, 0.01),
    }
  })

  const minProbability = clamp(
    Math.min(...ranges.map(({ mean, halfSpan }) => mean - halfSpan)),
    0,
    1
  )
  const maxProbability = clamp(
    Math.max(...ranges.map(({ mean, halfSpan }) => mean + halfSpan)),
    0,
    1
  )
  const span = Math.max(maxProbability - minProbability, 1e-4)

  const points = Array.from({ length: CHART_POINTS }, (_, index) => {
    const probability = minProbability + (span * index) / (CHART_POINTS - 1)
    const point: OverlayChartPoint = {
      probability,
      n100: 0,
      n500: 0,
      n2000: 0,
    }

    for (const { key, alpha, beta } of series) {
      point[key] = betaPdf(clamp(probability, 1e-4, 1 - 1e-4), alpha, beta)
    }

    return point
  })

  const maxDensity = points.reduce(
    (currentMax, point) =>
      Math.max(currentMax, point.n100, point.n500, point.n2000),
    0
  )

  return {
    maxDensity,
    points,
  }
}

export function createAbComparisonData(
  alphaA: number,
  betaA: number,
  alphaB: number,
  betaB: number
): AbComparisonResult {
  const computeRange = (alpha: number, beta: number) => {
    const mean = alpha / (alpha + beta)
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
    const standardDeviation = Math.sqrt(Math.max(variance, 1e-9))
    return { mean, halfSpan: Math.max(standardDeviation * 4.5, 0.01) }
  }

  const rangeA = computeRange(alphaA, betaA)
  const rangeB = computeRange(alphaB, betaB)

  const minProbability = clamp(
    Math.min(rangeA.mean - rangeA.halfSpan, rangeB.mean - rangeB.halfSpan),
    0,
    1
  )
  const maxProbability = clamp(
    Math.max(rangeA.mean + rangeA.halfSpan, rangeB.mean + rangeB.halfSpan),
    0,
    1
  )
  const span = Math.max(maxProbability - minProbability, 1e-4)
  const dx = span / (CHART_POINTS - 1)

  const points: AbChartPoint[] = []
  let maxDensity = 0
  let cdfA = 0
  let probBBeatsA = 0

  for (let index = 0; index < CHART_POINTS; index += 1) {
    const probability = minProbability + dx * index
    const x = clamp(probability, 1e-4, 1 - 1e-4)
    const fA = betaPdf(x, alphaA, betaA)
    const fB = betaPdf(x, alphaB, betaB)

    cdfA += fA * dx
    probBBeatsA += fB * cdfA * dx

    if (fA > maxDensity) maxDensity = fA
    if (fB > maxDensity) maxDensity = fB

    points.push({ probability, control: fA, variant: fB })
  }

  return { points, maxDensity, probBBeatsA: clamp(probBBeatsA, 0, 1) }
}

export function computeExpectedLoss(
  alphaA: number,
  betaA: number,
  alphaB: number,
  betaB: number
): { lossChooseA: number; lossChooseB: number } {
  const GRID = 600
  const dx = 1 / GRID
  let cdfA = 0
  let cdfB = 0
  let weightedSumA = 0
  let weightedSumB = 0
  let lossChooseB = 0
  let lossChooseA = 0

  for (let i = 0; i <= GRID; i++) {
    const x = clamp(i * dx, 1e-6, 1 - 1e-6)
    const fA = betaPdf(x, alphaA, betaA)
    const fB = betaPdf(x, alphaB, betaB)

    lossChooseB += fA * (x * cdfB - weightedSumB) * dx
    lossChooseA += fB * (x * cdfA - weightedSumA) * dx

    cdfA += fA * dx
    weightedSumA += x * fA * dx
    cdfB += fB * dx
    weightedSumB += x * fB * dx
  }

  return {
    lossChooseA: Math.max(lossChooseA, 0),
    lossChooseB: Math.max(lossChooseB, 0),
  }
}

export function createLossCurveData(
  controlRate: number,
  variantRate: number,
  currentN: number
): LossCurvePoint[] {
  const maxN = currentN + Math.max(currentN * 4, 1000)
  const POINTS = 40
  return Array.from({ length: POINTS }, (_, index) => {
    const n = Math.round(currentN + ((maxN - currentN) * index) / (POINTS - 1))
    /* Expected counts, not rounded ones. A Beta takes non-integer parameters,
       and rounding here quantises the projection into a sawtooth. */
    const controlSuccesses = n * controlRate
    const variantSuccesses = n * variantRate
    const { lossChooseA, lossChooseB } = computeExpectedLoss(
      1 + controlSuccesses,
      1 + (n - controlSuccesses),
      1 + variantSuccesses,
      1 + (n - variantSuccesses)
    )
    return { n, lossChooseA: lossChooseA * 100, lossChooseB: lossChooseB * 100 }
  })
}

export function formatProbability(value: number): string {
  return value.toFixed(2)
}

export function formatSliderValue(value: number): string {
  return value.toFixed(1)
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

export type WeekSummary = {
  week: number
  nPerVariant: number
  controlSuccesses: number
  variantSuccesses: number
  points: AbChartPoint[]
  maxDensity: number
  probBBeatsA: number
  lossChooseA: number
  lossChooseB: number
  call: "Ship B" | "Hold A"
  narrative: { heading: string; body: string }
}

export const TRUE_CONTROL_RATE = 0.05
export const TRUE_VARIANT_RATE = 0.065

/**
 * The whole six-week run at once, so the walkthrough can be shown as small
 * multiples and a table rather than one week at a time.
 */
export function createWorkedExample(): WeekSummary[] {
  return WORKED_EXAMPLE_WEEKS.map((data, index) => {
    const alphaA = 1 + data.controlSuccesses
    const betaA = 1 + data.nPerVariant - data.controlSuccesses
    const alphaB = 1 + data.variantSuccesses
    const betaB = 1 + data.nPerVariant - data.variantSuccesses
    const chart = createAbComparisonData(alphaA, betaA, alphaB, betaB)
    const loss = computeExpectedLoss(alphaA, betaA, alphaB, betaB)

    return {
      week: data.week,
      nPerVariant: data.nPerVariant,
      controlSuccesses: data.controlSuccesses,
      variantSuccesses: data.variantSuccesses,
      ...chart,
      ...loss,
      call: loss.lossChooseB < loss.lossChooseA ? "Ship B" : "Hold A",
      narrative: EXAMPLE_NARRATIVES[index],
    }
  })
}
