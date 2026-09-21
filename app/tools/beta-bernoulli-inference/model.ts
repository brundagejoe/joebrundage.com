import {
  betaCdf,
  betaEqualTailInterval,
  betaMean,
  betaMode,
  betaPdf,
  betaProbabilityBetween,
  clamp,
  updateBetaPosterior,
} from "@/shared/lib/bayes"

export type HypothesisMode = "around" | "above" | "below"

export type ToolInputs = {
  trials: string
  successes: string
  priorAlpha: string
  priorBeta: string
  queryMode: HypothesisMode
  targetRate: string
  tolerancePercent: string
}

export type Query =
  | {
      mode: "around"
      targetRate: number
      tolerance: number
      lower: number
      upper: number
    }
  | {
      mode: "above" | "below"
      targetRate: number
    }

export type ComputedPosteriorSummary = {
  trials: number
  successes: number
  failures: number
  priorAlpha: number
  priorBeta: number
  posteriorAlpha: number
  posteriorBeta: number
  posteriorMean: number
  posteriorMode: number | null
  credibleInterval: {
    lower: number
    upper: number
  }
  query: Query
  queryProbability: number
  explanation: string
}

export type ChartPoint = {
  probabilityPercent: number
  priorDensity: number
  posteriorDensity: number
  shadedDensity: number | null
}

export const DEFAULT_INPUTS: ToolInputs = {
  trials: "20",
  successes: "11",
  priorAlpha: "1",
  priorBeta: "1",
  queryMode: "around",
  targetRate: "50%",
  tolerancePercent: "5",
}

export const EXAMPLES: Array<{
  label: string
  description: string
  inputs: ToolInputs
}> = [
  {
    label: "Weak evidence near 50%",
    description: "A small sample with only a modest deviation from parity.",
    inputs: {
      trials: "20",
      successes: "11",
      priorAlpha: "1",
      priorBeta: "1",
      queryMode: "around",
      targetRate: "50%",
      tolerancePercent: "5",
    },
  },
  {
    label: "Strong evidence above baseline",
    description: "A larger sample where the posterior leans above a practical threshold.",
    inputs: {
      trials: "120",
      successes: "78",
      priorAlpha: "1",
      priorBeta: "1",
      queryMode: "above",
      targetRate: "60%",
      tolerancePercent: "5",
    },
  },
  {
    label: "Extreme small sample",
    description: "An eye-catching early result that is still highly uncertain.",
    inputs: {
      trials: "5",
      successes: "5",
      priorAlpha: "1",
      priorBeta: "1",
      queryMode: "above",
      targetRate: "70%",
      tolerancePercent: "5",
    },
  },
  {
    label: "Skeptical prior",
    description: "The same style of question under a stronger prior centered near 50%.",
    inputs: {
      trials: "40",
      successes: "26",
      priorAlpha: "8",
      priorBeta: "8",
      queryMode: "above",
      targetRate: "55%",
      tolerancePercent: "5",
    },
  },
]
export function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

export function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function parseRateToken(rawValue: string): number | null {
  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  const hasPercent = trimmed.endsWith("%")
  const numericPart = hasPercent ? trimmed.slice(0, -1).trim() : trimmed
  const parsed = Number(numericPart)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null
  }

  if (hasPercent || parsed > 1) {
    if (parsed > 100) {
      return null
    }

    return parsed / 100
  }

  return parsed
}

export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatRateRange(lower: number, upper: number): string {
  return `${formatPercent(lower, 1)} to ${formatPercent(upper, 1)}`
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

export function getInputsFromSearchParams(searchParams: URLSearchParams): ToolInputs {
  const mode = searchParams.get("queryMode")
  const queryMode: HypothesisMode =
    mode === "above" || mode === "below" || mode === "around"
      ? mode
      : DEFAULT_INPUTS.queryMode

  return {
    trials: searchParams.get("trials") ?? DEFAULT_INPUTS.trials,
    successes: searchParams.get("successes") ?? DEFAULT_INPUTS.successes,
    priorAlpha: searchParams.get("priorAlpha") ?? DEFAULT_INPUTS.priorAlpha,
    priorBeta: searchParams.get("priorBeta") ?? DEFAULT_INPUTS.priorBeta,
    queryMode,
    targetRate: searchParams.get("targetRate") ?? DEFAULT_INPUTS.targetRate,
    tolerancePercent:
      searchParams.get("tolerancePercent") ?? DEFAULT_INPUTS.tolerancePercent,
  }
}

export function createSearchParamsFromInputs(inputs: ToolInputs): URLSearchParams {
  const searchParams = new URLSearchParams()

  searchParams.set("trials", inputs.trials)
  searchParams.set("successes", inputs.successes)
  searchParams.set("priorAlpha", inputs.priorAlpha)
  searchParams.set("priorBeta", inputs.priorBeta)
  searchParams.set("queryMode", inputs.queryMode)
  searchParams.set("targetRate", inputs.targetRate)

  if (inputs.queryMode === "around") {
    searchParams.set("tolerancePercent", inputs.tolerancePercent)
  }

  return searchParams
}

export function parseQuery(
  queryMode: HypothesisMode,
  targetRateInput: string,
  tolerancePercentInput: string
): { query: Query | null; error: string | null } {
  const targetRate = parseRateToken(targetRateInput)

  if (targetRate === null || targetRate < 0 || targetRate > 1) {
    return {
      query: null,
      error: "Target rate must stay between 0% and 100%.",
    }
  }

  if (queryMode === "around") {
    const toleranceValue = Number(tolerancePercentInput)

    if (
      !Number.isFinite(toleranceValue) ||
      toleranceValue <= 0 ||
      toleranceValue > 50
    ) {
      return {
        query: null,
        error: "Tolerance must be a number between 0 and 50.",
      }
    }

    const tolerance = toleranceValue / 100
    return {
      query: {
        mode: "around",
        targetRate,
        tolerance,
        lower: clamp(targetRate - tolerance, 0, 1),
        upper: clamp(targetRate + tolerance, 0, 1),
      },
      error: null,
    }
  }

  return {
    query: {
      mode: queryMode,
      targetRate,
    },
    error: null,
  }
}

export function computeQueryProbability(
  alpha: number,
  beta: number,
  query: Query
): number {
  if (query.mode === "around") {
    return betaProbabilityBetween(query.lower, query.upper, alpha, beta)
  }

  if (query.mode === "above") {
    return 1 - betaProbabilityBetween(0, query.targetRate, alpha, beta)
  }

  return betaProbabilityBetween(0, query.targetRate, alpha, beta)
}

export function describeQuery(query: Query): string {
  if (query.mode === "around") {
    return `around ${formatPercent(query.targetRate, 1)} (${formatRateRange(query.lower, query.upper)})`
  }

  return `${query.mode === "above" ? "above" : "below"} ${formatPercent(query.targetRate, 1)}`
}


export function createChartData(summary: ComputedPosteriorSummary): ChartPoint[] {
  const points = 180

  return Array.from({ length: points }, (_, index) => {
    const probability = index / (points - 1)
    const boundedProbability = clamp(probability, 1e-4, 1 - 1e-4)
    const priorDensity = betaPdf(
      boundedProbability,
      summary.priorAlpha,
      summary.priorBeta
    )
    const posteriorDensity = betaPdf(
      boundedProbability,
      summary.posteriorAlpha,
      summary.posteriorBeta
    )
    const isShaded =
      summary.query.mode === "around"
        ? probability >= summary.query.lower && probability <= summary.query.upper
        : summary.query.mode === "above"
          ? probability >= summary.query.targetRate
          : probability <= summary.query.targetRate

    return {
      probabilityPercent: probability * 100,
      priorDensity,
      posteriorDensity,
      shadedDensity: isShaded ? posteriorDensity : null,
    }
  })
}


export type SweepPoint = {
  targetRate: number
  probability: number
}

export type PosteriorReport = ComputedPosteriorSummary & {
  priorMean: number
  priorInterval: { lower: number; upper: number }
  /** α+β of the prior reads as the number of observations it is worth. */
  priorWeight: number
  chart: ChartPoint[]
  sweep: SweepPoint[]
}

const SWEEP_POINTS = 160

/**
 * The hypothesis probability as the target rate moves across the whole range.
 * One number becomes a curve, so the reader can see how much the answer
 * depends on where the line was drawn.
 */
export function createSweep(
  alpha: number,
  beta: number,
  query: Query
): SweepPoint[] {
  return Array.from({ length: SWEEP_POINTS }, (_, index) => {
    const targetRate = index / (SWEEP_POINTS - 1)
    const probability =
      query.mode === "around"
        ? betaProbabilityBetween(
            clamp(targetRate - query.tolerance, 0, 1),
            clamp(targetRate + query.tolerance, 0, 1),
            alpha,
            beta
          )
        : query.mode === "above"
          ? 1 - betaCdf(targetRate, alpha, beta)
          : betaCdf(targetRate, alpha, beta)

    return { targetRate, probability }
  })
}

export function buildReport(
  trials: number,
  successes: number,
  priorAlpha: number,
  priorBeta: number,
  query: Query
): PosteriorReport {
  const posterior = updateBetaPosterior({
    alpha: priorAlpha,
    beta: priorBeta,
    trials,
    successes,
  })
  const summary: ComputedPosteriorSummary = {
    trials,
    successes,
    failures: trials - successes,
    priorAlpha,
    priorBeta,
    posteriorAlpha: posterior.alpha,
    posteriorBeta: posterior.beta,
    posteriorMean: betaMean(posterior.alpha, posterior.beta),
    posteriorMode: betaMode(posterior.alpha, posterior.beta),
    credibleInterval: betaEqualTailInterval(posterior.alpha, posterior.beta),
    query,
    queryProbability: computeQueryProbability(
      posterior.alpha,
      posterior.beta,
      query
    ),
    explanation: "",
  }

  return {
    ...summary,
    priorMean: betaMean(priorAlpha, priorBeta),
    priorInterval: betaEqualTailInterval(priorAlpha, priorBeta),
    priorWeight: priorAlpha + priorBeta,
    chart: createChartData(summary),
    sweep: createSweep(posterior.alpha, posterior.beta, query),
  }
}
