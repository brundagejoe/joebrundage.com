import { analyze, PRIOR_ALPHA, PRIOR_BETA, type AnalyzeResult } from "bayes-ab"

export type Inputs = {
  visitorsA: string
  conversionsA: string
  visitorsB: string
  conversionsB: string
  thresholdPercent: string
  meaningfulLiftPercent: string
}

export type PosteriorPoint = {
  conversionRatePercent: number
  variantA: number
  variantB: number
  overlap: number
}

export type LiftDensityPoint = {
  relativeLift: number
  density: number
}

export type EvidenceStrength = "Low" | "Moderate" | "Strong"
export type ExperimentMaturity = "Early" | "Building" | "Mature"
export type ChosenVariant = "Variant A" | "Variant B"

export type WaitingScenario = {
  extraVisitorsPerVariant: number
  expectedRegretAfterWaiting: number
  valueOfWaiting: number
}

export type AnalysisResult = {
  meaningfulLift: number
  decisionThreshold: number
  visitorsA: number
  conversionsA: number
  visitorsB: number
  conversionsB: number
  posteriorAlphaA: number
  posteriorBetaA: number
  posteriorAlphaB: number
  posteriorBetaB: number
  observedRateA: number
  observedRateB: number
  posteriorMeanA: number
  posteriorMeanB: number
  probabilityBBeatsA: number
  probabilityABeatsB: number
  probabilityMeaningfulLift: number
  probabilityMeaningfulHarm: number
  probabilityImprovesOnePercent: number
  probabilityImprovesFivePercent: number
  probabilityHarmFivePercent: number
  probabilityHarmTenPercent: number
  probabilityTreatmentHarmful: number
  expectedLossIfShipA: number
  expectedLossIfShipB: number
  observedAbsoluteDifference: number
  posteriorAbsoluteDifference: number
  observedRelativeLift: number | null
  posteriorRelativeLift: number
  liftCredibleIntervalLower: number
  liftCredibleIntervalUpper: number
  absoluteDiffCredibleIntervalLower: number
  absoluteDiffCredibleIntervalUpper: number
  pValueTwoSided: number
  chartData: PosteriorPoint[]
  liftDensity: LiftDensityPoint[]
  liftMedian: number
  liftInnerIntervalLower: number
  liftInnerIntervalUpper: number
  requiredVisitorsPerVariant: number
  visitorsPerVariant: number
  totalConversions: number
  recommendedConversionsPerVariant: number
  additionalVisitorsForStableEstimate: number
  detectableEffectRelative: number
  evidenceStrength: EvidenceStrength
  experimentMaturity: ExperimentMaturity
  maturityProgress: number
  decisionStatus: "Ship Variant B" | "Keep Variant A" | "Continue test" | "Inconclusive"
  chosenVariantNow: ChosenVariant
  expectedRegretIfShipNow: number
  waitingScenarios: WaitingScenario[]
}

function parseWholeNumber(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    return null
  }

  return parsed
}

function parsePositiveWholeNumber(value: string): number | null {
  const parsed = parseWholeNumber(value)
  if (parsed === null || parsed < 1) {
    return null
  }
  return parsed
}

export function parsePercent(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

export function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

export function formatRelativeLift(value: number | null, digits = 2): string {
  if (value === null) {
    return "n/a"
  }

  return `${value < 0 ? "−" : "+"}${Math.abs(value * 100).toFixed(digits)}%`
}

export function formatPercentagePoints(value: number, digits = 2): string {
  const points = value * 100
  return `${points < 0 ? "−" : "+"}${Math.abs(points).toFixed(digits)} pp`
}

export function formatUnsignedPercentagePoints(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)} pp`
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

export function formatExpectedMissedConversions(
  regretRate: number,
  visitors: number,
  digits?: number
): string {
  const missedConversions = regretRate * visitors
  const resolvedDigits =
    digits ?? (missedConversions < 1 ? 2 : missedConversions < 10 ? 1 : 0)

  return `${missedConversions.toFixed(resolvedDigits)} per ${visitors.toLocaleString(
    "en-US"
  )} visitors`
}

/* The math lives in the bayes-ab package (github.com/brundagejoe/bayes-ab),
   which the bayes-ab CLI also uses, so the page and the command line cannot
   disagree. This file only parses the form, maps the library's result onto
   the shape the page renders, and formats numbers. */

export const FIXED_PRIOR_ALPHA = PRIOR_ALPHA
export const FIXED_PRIOR_BETA = PRIOR_BETA

/* A rule-of-thumb floor the page shows next to the sample-size estimate. */
const RECOMMENDED_CONVERSIONS_PER_VARIANT = 200

const DECISION_STATUS: Record<
  AnalyzeResult["decision"]["status"],
  AnalysisResult["decisionStatus"]
> = {
  ship_b: "Ship Variant B",
  keep_a: "Keep Variant A",
  continue: "Continue test",
  inconclusive: "Inconclusive",
}

const EVIDENCE_STRENGTH: Record<AnalyzeResult["decision"]["evidence"], EvidenceStrength> = {
  low: "Low",
  moderate: "Moderate",
  strong: "Strong",
}

const EXPERIMENT_MATURITY: Record<AnalyzeResult["decision"]["maturity"], ExperimentMaturity> = {
  early: "Early",
  building: "Building",
  mature: "Mature",
}

function calculateAnalysis({
  visitorsA,
  conversionsA,
  visitorsB,
  conversionsB,
  decisionThreshold,
  meaningfulLift,
}: {
  visitorsA: number
  conversionsA: number
  visitorsB: number
  conversionsB: number
  decisionThreshold: number
  meaningfulLift: number
}): AnalysisResult {
  const result = analyze({
    visitorsA,
    conversionsA,
    visitorsB,
    conversionsB,
    threshold: decisionThreshold,
    minEffect: meaningfulLift,
    includeChart: true,
  })
  const { decision, probability, effect, expectedLoss, variants, sampleSize } = result

  return {
    meaningfulLift,
    decisionThreshold,
    visitorsA,
    conversionsA,
    visitorsB,
    conversionsB,
    posteriorAlphaA: variants.A.posterior[0],
    posteriorBetaA: variants.A.posterior[1],
    posteriorAlphaB: variants.B.posterior[0],
    posteriorBetaB: variants.B.posterior[1],
    observedRateA: variants.A.rate,
    observedRateB: variants.B.rate,
    posteriorMeanA: variants.A.posteriorMean,
    posteriorMeanB: variants.B.posteriorMean,
    probabilityBBeatsA: probability.bBeatsA,
    probabilityABeatsB: probability.aBeatsB,
    probabilityMeaningfulLift: probability.meaningfulLift,
    probabilityMeaningfulHarm: probability.meaningfulHarm,
    probabilityImprovesOnePercent: probability.liftAbove1pct,
    probabilityImprovesFivePercent: probability.liftAbove5pct,
    probabilityHarmFivePercent: probability.harmBeyond5pct,
    probabilityHarmTenPercent: probability.harmBeyond10pct,
    probabilityTreatmentHarmful: probability.harmful,
    expectedLossIfShipA: expectedLoss.shipA,
    expectedLossIfShipB: expectedLoss.shipB,
    observedAbsoluteDifference: effect.observedAbsoluteDiff,
    posteriorAbsoluteDifference: effect.absoluteDiff,
    observedRelativeLift: effect.observedRelativeLift,
    posteriorRelativeLift: effect.relativeLift,
    liftCredibleIntervalLower: effect.relativeLiftCI95[0],
    liftCredibleIntervalUpper: effect.relativeLiftCI95[1],
    absoluteDiffCredibleIntervalLower: effect.absoluteDiffCI95[0],
    absoluteDiffCredibleIntervalUpper: effect.absoluteDiffCI95[1],
    pValueTwoSided: result.frequentist.pValueTwoSided,
    chartData: (result.chart ?? []).map((point) => ({
      conversionRatePercent: point.rate * 100,
      variantA: point.densityA,
      variantB: point.densityB,
      overlap: Math.min(point.densityA, point.densityB),
    })),
    liftDensity: result.liftChart ?? [],
    liftMedian: effect.relativeLiftMedian,
    liftInnerIntervalLower: effect.relativeLiftIQR[0],
    liftInnerIntervalUpper: effect.relativeLiftIQR[1],
    requiredVisitorsPerVariant: sampleSize.requiredPerVariant,
    visitorsPerVariant: Math.round((visitorsA + visitorsB) / 2),
    totalConversions: conversionsA + conversionsB,
    recommendedConversionsPerVariant: RECOMMENDED_CONVERSIONS_PER_VARIANT,
    additionalVisitorsForStableEstimate: sampleSize.additionalPerVariant,
    detectableEffectRelative: sampleSize.detectableEffectNow,
    evidenceStrength: EVIDENCE_STRENGTH[decision.evidence],
    experimentMaturity: EXPERIMENT_MATURITY[decision.maturity],
    maturityProgress: decision.maturityProgress,
    decisionStatus: DECISION_STATUS[decision.status],
    chosenVariantNow: decision.bayesActionNow === "B" ? "Variant B" : "Variant A",
    expectedRegretIfShipNow: decision.expectedRegretNow,
    waitingScenarios: result.waiting.map((scenario) => ({
      extraVisitorsPerVariant: scenario.extraPerVariant,
      expectedRegretAfterWaiting: scenario.expectedRegret,
      valueOfWaiting: scenario.valueOfWaiting,
    })),
  }
}

export function getInitialInputs(): Inputs {
  return {
    visitorsA: "12000",
    conversionsA: "660",
    visitorsB: "11850",
    conversionsB: "714",
    thresholdPercent: "95",
    meaningfulLiftPercent: "10",
  }
}

export function getInputsFromSearchParams(searchParams: URLSearchParams): Inputs {
  const defaults = getInitialInputs()

  return {
    visitorsA: searchParams.get("visitorsA") ?? defaults.visitorsA,
    conversionsA: searchParams.get("conversionsA") ?? defaults.conversionsA,
    visitorsB: searchParams.get("visitorsB") ?? defaults.visitorsB,
    conversionsB: searchParams.get("conversionsB") ?? defaults.conversionsB,
    thresholdPercent:
      searchParams.get("thresholdPercent") ?? defaults.thresholdPercent,
    meaningfulLiftPercent:
      searchParams.get("meaningfulLiftPercent") ?? defaults.meaningfulLiftPercent,
  }
}

export function createSearchParamsFromInputs(inputs: Inputs): URLSearchParams {
  const searchParams = new URLSearchParams()

  searchParams.set("visitorsA", inputs.visitorsA)
  searchParams.set("conversionsA", inputs.conversionsA)
  searchParams.set("visitorsB", inputs.visitorsB)
  searchParams.set("conversionsB", inputs.conversionsB)
  searchParams.set("thresholdPercent", inputs.thresholdPercent)
  searchParams.set("meaningfulLiftPercent", inputs.meaningfulLiftPercent)

  return searchParams
}

export function validateAndCalculate(inputs: Inputs):
  | { error: string; result: null }
  | { error: null; result: AnalysisResult } {
  const visitorsA = parsePositiveWholeNumber(inputs.visitorsA)
  const conversionsA = parseWholeNumber(inputs.conversionsA)
  const visitorsB = parsePositiveWholeNumber(inputs.visitorsB)
  const conversionsB = parseWholeNumber(inputs.conversionsB)
  const decisionThreshold = parsePercent(inputs.thresholdPercent)
  const practicalThreshold = parsePercent(inputs.meaningfulLiftPercent)

  if (
    visitorsA === null ||
    conversionsA === null ||
    visitorsB === null ||
    conversionsB === null
  ) {
    return {
      error: "Traffic and conversions must be whole numbers.",
      result: null,
    }
  }

  if (conversionsA > visitorsA || conversionsB > visitorsB) {
    return {
      error: "Conversions cannot exceed visitors.",
      result: null,
    }
  }

  if (
    decisionThreshold === null ||
    decisionThreshold <= 50 ||
    decisionThreshold >= 100
  ) {
    return {
      error: "Decision threshold must be a percent between 50 and 100.",
      result: null,
    }
  }

  if (
    practicalThreshold === null ||
    practicalThreshold < 0 ||
    practicalThreshold >= 100
  ) {
    return {
      error: "Minimum meaningful lift must be a percent between 0 and 100.",
      result: null,
    }
  }

  return {
    error: null,
    result: calculateAnalysis({
      visitorsA,
      conversionsA,
      visitorsB,
      conversionsB,
      decisionThreshold: decisionThreshold / 100,
      meaningfulLift: practicalThreshold / 100,
    }),
  }
}

export function getInitialResult(): AnalysisResult {
  return calculateAnalysis({
    visitorsA: 12000,
    conversionsA: 660,
    visitorsB: 11850,
    conversionsB: 714,
    decisionThreshold: 0.95,
    meaningfulLift: 0.1,
  })
}
