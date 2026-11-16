import {
  analyzeSkeptical,
  calibrateLiftPrior,
  parsePastTestsCsv,
  DEFAULT_LIFT_PRIOR_SD,
  DEFAULT_MAX_RELATIVE_LOSS,
  DEFAULT_SKEPTICAL_MIN_EFFECT,
  type CalibrationResult,
  type SkepticalResult,
  type SkepticalStatus,
} from "bayes-ab"

/* The math lives in the bayes-ab package (analyzeSkeptical), which the
   `bayes-ab skeptical` command also uses, so the page and the command line
   cannot disagree. This file parses the form, runs the analysis and formats. */

export type Inputs = {
  visitorsA: string
  conversionsA: string
  visitorsB: string
  conversionsB: string
  liftPriorSdPercent: string
  thresholdPercent: string
  maxLossPercent: string
  meaningfulLiftPercent: string
}

export type SensitivityRow = {
  liftPriorSd: number
  status: SkepticalStatus
  median: number
  lower: number
  upper: number
  current: boolean
}

export type Analysis = {
  result: SkepticalResult
  sensitivity: SensitivityRow[]
}

const DEFAULT_INPUTS: Inputs = {
  visitorsA: "10000",
  conversionsA: "200",
  visitorsB: "10000",
  conversionsB: "230",
  liftPriorSdPercent: String(DEFAULT_LIFT_PRIOR_SD * 100),
  thresholdPercent: "95",
  maxLossPercent: String(DEFAULT_MAX_RELATIVE_LOSS * 100),
  meaningfulLiftPercent: String(DEFAULT_SKEPTICAL_MIN_EFFECT * 100),
}

const PARAM_KEYS = Object.keys(DEFAULT_INPUTS) as (keyof Inputs)[]

export function getInitialInputs(): Inputs {
  return { ...DEFAULT_INPUTS }
}

export function getInputsFromSearchParams(
  searchParams: URLSearchParams
): Inputs {
  const inputs = getInitialInputs()
  for (const key of PARAM_KEYS) {
    const value = searchParams.get(key)
    if (value !== null) inputs[key] = value
  }
  return inputs
}

export function createSearchParamsFromInputs(inputs: Inputs): URLSearchParams {
  const searchParams = new URLSearchParams()
  for (const key of PARAM_KEYS) searchParams.set(key, inputs[key])
  return searchParams
}

function parseWholeNumber(value: string): number | null {
  const cleaned = value.trim().replace(/[,_\s]/g, "")
  if (!/^\d+$/.test(cleaned)) return null
  const parsed = Number(cleaned)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function parsePercent(value: string): number | null {
  const cleaned = value.trim().replace(/%$/, "")
  if (cleaned === "") return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed / 100 : null
}

const SENSITIVITY_FACTORS = [0.5, 1, 1.5]

function run(
  counts: {
    visitorsA: number
    conversionsA: number
    visitorsB: number
    conversionsB: number
  },
  rules: {
    liftPriorSd: number
    threshold: number
    maxRelativeLoss: number
    minEffect: number
  }
): Analysis {
  const result = analyzeSkeptical({ ...counts, ...rules, includeChart: true })
  /* The library's sensitivity rows carry the decision and the estimate; the
     figure also wants each interval, so rerun the cheap closed form. */
  const sensitivity = SENSITIVITY_FACTORS.map((factor) => {
    const liftPriorSd = rules.liftPriorSd * factor
    const row =
      factor === 1
        ? result
        : analyzeSkeptical({ ...counts, ...rules, liftPriorSd })
    return {
      liftPriorSd,
      status: row.decision.status,
      median: row.effect.relativeLift,
      lower: row.effect.relativeLiftCI95[0],
      upper: row.effect.relativeLiftCI95[1],
      current: factor === 1,
    }
  })
  return { result, sensitivity }
}

export function validateAndCalculate(
  inputs: Inputs
): { error: string; analysis: null } | { error: null; analysis: Analysis } {
  const visitorsA = parseWholeNumber(inputs.visitorsA)
  const conversionsA = parseWholeNumber(inputs.conversionsA)
  const visitorsB = parseWholeNumber(inputs.visitorsB)
  const conversionsB = parseWholeNumber(inputs.conversionsB)
  const liftPriorSd = parsePercent(inputs.liftPriorSdPercent)
  const threshold = parsePercent(inputs.thresholdPercent)
  const maxRelativeLoss = parsePercent(inputs.maxLossPercent)
  const minEffect = parsePercent(inputs.meaningfulLiftPercent)

  if (
    visitorsA === null ||
    conversionsA === null ||
    visitorsB === null ||
    conversionsB === null
  ) {
    return {
      error: "Visitors and conversions must be whole numbers.",
      analysis: null,
    }
  }
  if (visitorsA < 1 || visitorsB < 1) {
    return { error: "Each variant needs at least one visitor.", analysis: null }
  }
  if (conversionsA > visitorsA || conversionsB > visitorsB) {
    return { error: "Conversions cannot exceed visitors.", analysis: null }
  }
  if (liftPriorSd === null || liftPriorSd <= 0 || liftPriorSd > 0.5) {
    return {
      error: "Typical lift must be a percent above 0 and at most 50.",
      analysis: null,
    }
  }
  if (threshold === null || threshold <= 0.5 || threshold >= 1) {
    return {
      error: "Act above must be a percent between 50 and 100.",
      analysis: null,
    }
  }
  if (maxRelativeLoss === null || maxRelativeLoss < 0 || maxRelativeLoss >= 1) {
    return {
      error: "Acceptable loss must be a percent from 0 up to 100.",
      analysis: null,
    }
  }
  if (minEffect === null || minEffect < 0 || minEffect >= 1) {
    return {
      error: "No-effect band must be a percent from 0 up to 100.",
      analysis: null,
    }
  }

  return {
    error: null,
    analysis: run(
      { visitorsA, conversionsA, visitorsB, conversionsB },
      { liftPriorSd, threshold, maxRelativeLoss, minEffect }
    ),
  }
}

export function getInitialAnalysis(): Analysis {
  const state = validateAndCalculate(DEFAULT_INPUTS)
  if (!state.analysis) throw new Error(state.error)
  return state.analysis
}

export const EXAMPLE_PAST_TESTS = `visitorsA,conversionsA,visitorsB,conversionsB
150000,2984,150000,3000
240000,4810,240000,4696
200000,4046,200000,4064
240000,4703,240000,4809
150000,3031,150000,3056
120000,2392,120000,2342
240000,4832,240000,5158
240000,4773,240000,4529
200000,4069,200000,3645
180000,3626,180000,3736
150000,3081,150000,3010
200000,3938,200000,3700
180000,3587,180000,3465
120000,2492,120000,2369
150000,2954,150000,2899`

export function calibrate(
  text: string
):
  | { error: string; calibration: null }
  | { error: null; calibration: CalibrationResult } {
  try {
    return {
      error: null,
      calibration: calibrateLiftPrior(parsePastTestsCsv(text)),
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      calibration: null,
    }
  }
}

/** A prior spread as the rail shows it: one decimal, trailing zero dropped. */
export function formatSpreadInput(liftPriorSd: number): string {
  return String(Number((liftPriorSd * 100).toFixed(1)))
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

/** An expected loss in percentage points: unsigned, with enough digits to show small losses. */
export function formatLossPoints(value: number): string {
  const points = value * 100
  const digits = points >= 0.01 ? 3 : 4
  return `${points.toFixed(digits)} pp`
}
