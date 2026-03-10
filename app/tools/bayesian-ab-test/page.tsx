"use client"

import * as React from "react"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import { Button } from "@/shared/ui/button"
import { Badge } from "@/shared/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Separator } from "@/shared/ui/separator"

type Inputs = {
  visitorsA: string
  conversionsA: string
  visitorsB: string
  conversionsB: string
  priorAlpha: string
  priorBeta: string
  thresholdPercent: string
  meaningfulLiftPercent: string
}

type PosteriorPoint = {
  conversionRatePercent: number
  variantA: number
  variantB: number
  overlap: number
}

type EvidenceStrength = "Low" | "Moderate" | "Strong"
type ExperimentMaturity = "Early" | "Building" | "Mature"

type AnalysisResult = {
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
  visitorsPerVariant: number
  totalConversions: number
  recommendedConversionsPerVariant: number
  additionalVisitorsForStableEstimate: number
  detectableEffectRelative: number
  evidenceStrength: EvidenceStrength
  experimentMaturity: ExperimentMaturity
  maturityProgress: number
  decisionStatus: "Ship Variant B" | "Keep Variant A" | "Continue test" | "Inconclusive"
}

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

const MONTE_CARLO_SAMPLES = 12000
const POSTERIOR_CHART_POINTS = 96

const POSTERIOR_CHART_CONFIG = {
  variantA: {
    label: "Variant A",
    theme: {
      light: "oklch(0.64 0.08 250)",
      dark: "oklch(0.69 0.05 250)",
      terminal: "rgb(103 139 183)",
    },
  },
  variantB: {
    label: "Variant B",
    theme: {
      light: "oklch(0.56 0.18 251)",
      dark: "oklch(0.74 0.12 251)",
      terminal: "rgb(166 206 255)",
    },
  },
  overlap: {
    label: "Overlap",
    theme: {
      light: "oklch(0.78 0.05 245)",
      dark: "oklch(0.58 0.04 245)",
      terminal: "rgb(84 114 148)",
    },
  },
} satisfies ChartConfig

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

function parsePercent(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

function formatRelativeLift(value: number | null, digits = 2): string {
  if (value === null) {
    return "n/a"
  }

  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(digits)}%`
}

function formatPercentagePoints(value: number, digits = 2): string {
  const points = value * 100
  return `${points >= 0 ? "+" : ""}${points.toFixed(digits)} pp`
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
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

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b)
}

function betaPdf(x: number, alpha: number, beta: number): number {
  const boundedX = clamp(x, 1e-9, 1 - 1e-9)
  return Math.exp(
    (alpha - 1) * Math.log(boundedX) +
      (beta - 1) * Math.log(1 - boundedX) -
      logBeta(alpha, beta)
  )
}

function makeDeterministicRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}

function sampleStandardNormal(random: () => number): number {
  const u1 = clamp(random(), 1e-12, 1 - 1e-12)
  const u2 = random()

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

function sampleGamma(shape: number, random: () => number): number {
  if (shape < 1) {
    const u = clamp(random(), 1e-12, 1 - 1e-12)
    return sampleGamma(shape + 1, random) * u ** (1 / shape)
  }

  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)

  while (true) {
    const x = sampleStandardNormal(random)
    const v = (1 + c * x) ** 3

    if (v <= 0) {
      continue
    }

    const u = random()

    if (u < 1 - 0.0331 * x ** 4) {
      return d * v
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v
    }
  }
}

function sampleBeta(alpha: number, beta: number, random: () => number): number {
  const x = sampleGamma(alpha, random)
  const y = sampleGamma(beta, random)
  return x / (x + y)
}

function quantile(sortedValues: number[], probability: number): number {
  const boundedProbability = clamp(probability, 0, 1)
  const position = (sortedValues.length - 1) * boundedProbability
  const lowerIndex = Math.floor(position)
  const upperIndex = Math.ceil(position)

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex]
  }

  const weight = position - lowerIndex
  return (
    sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
  )
}

function mean(values: number[]): number {
  return values.reduce((sum, current) => sum + current, 0) / values.length
}

function probabilityRightBeatsLeftDirect({
  alphaLeft,
  betaLeft,
  alphaRight,
  betaRight,
}: {
  alphaLeft: number
  betaLeft: number
  alphaRight: number
  betaRight: number
}): number {
  const base = logBeta(alphaLeft, betaLeft)
  let maxLog = Number.NEGATIVE_INFINITY
  let scaledSum = 0

  for (let i = 0; i <= alphaRight - 1; i += 1) {
    const current =
      logBeta(alphaLeft + i, betaLeft + betaRight) -
      Math.log(betaRight + i) -
      logBeta(1 + i, betaRight) -
      base

    if (current <= maxLog) {
      scaledSum += Math.exp(current - maxLog)
      continue
    }

    scaledSum = scaledSum * Math.exp(maxLog - current) + 1
    maxLog = current
  }

  return Math.exp(maxLog) * scaledSum
}

function probabilityVariantBBeatsA({
  alphaA,
  betaA,
  alphaB,
  betaB,
}: {
  alphaA: number
  betaA: number
  alphaB: number
  betaB: number
}): number {
  if (alphaB <= alphaA) {
    return probabilityRightBeatsLeftDirect({
      alphaLeft: alphaA,
      betaLeft: betaA,
      alphaRight: alphaB,
      betaRight: betaB,
    })
  }

  return (
    1 -
    probabilityRightBeatsLeftDirect({
      alphaLeft: alphaB,
      betaLeft: betaB,
      alphaRight: alphaA,
      betaRight: betaA,
    })
  )
}

function inverseNormalCdf(p: number): number {
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

  const probability = clamp(p, 1e-9, 1 - 1e-9)
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

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const absoluteX = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * absoluteX)
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-absoluteX * absoluteX)

  return sign * y
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

function calculateTwoSidedPValue({
  visitorsA,
  conversionsA,
  visitorsB,
  conversionsB,
}: {
  visitorsA: number
  conversionsA: number
  visitorsB: number
  conversionsB: number
}): number {
  const pA = conversionsA / visitorsA
  const pB = conversionsB / visitorsB
  const pooled = (conversionsA + conversionsB) / (visitorsA + visitorsB)
  const standardError = Math.sqrt(
    pooled *
      (1 - pooled) *
      (1 / visitorsA + 1 / visitorsB)
  )

  if (standardError === 0) {
    return 1
  }

  const z = (pB - pA) / standardError
  return clamp(2 * (1 - normalCdf(Math.abs(z))), 0, 1)
}

function createPosteriorChartData({
  posteriorAlphaA,
  posteriorBetaA,
  posteriorAlphaB,
  posteriorBetaB,
  samplesA,
  samplesB,
}: {
  posteriorAlphaA: number
  posteriorBetaA: number
  posteriorAlphaB: number
  posteriorBetaB: number
  samplesA: number[]
  samplesB: number[]
}): PosteriorPoint[] {
  const sortedA = [...samplesA].sort((left, right) => left - right)
  const sortedB = [...samplesB].sort((left, right) => left - right)
  const minRate = Math.max(
    1e-4,
    Math.min(quantile(sortedA, 0.001), quantile(sortedB, 0.001)) * 0.9
  )
  const maxRate = Math.min(
    0.9999,
    Math.max(quantile(sortedA, 0.999), quantile(sortedB, 0.999)) * 1.1
  )
  const span = maxRate - minRate

  return Array.from({ length: POSTERIOR_CHART_POINTS }, (_, index) => {
    const x = minRate + (span * index) / (POSTERIOR_CHART_POINTS - 1)
    const densityA = betaPdf(x, posteriorAlphaA, posteriorBetaA)
    const densityB = betaPdf(x, posteriorAlphaB, posteriorBetaB)

    return {
      conversionRatePercent: x * 100,
      variantA: densityA,
      variantB: densityB,
      overlap: Math.min(densityA, densityB),
    }
  })
}

function calculateRequiredSamplePerVariant({
  baselineRate,
  meaningfulLift,
  alpha = 0.05,
  power = 0.8,
}: {
  baselineRate: number
  meaningfulLift: number
  alpha?: number
  power?: number
}): number {
  const boundedBaseline = clamp(baselineRate, 1e-6, 1 - 1e-6)
  const absoluteDelta = Math.max(boundedBaseline * meaningfulLift, 1e-6)
  const zAlpha = inverseNormalCdf(1 - alpha / 2)
  const zPower = inverseNormalCdf(power)
  const standardDeviation = Math.sqrt(
    2 * boundedBaseline * (1 - boundedBaseline)
  )

  return Math.ceil(((zAlpha + zPower) * standardDeviation / absoluteDelta) ** 2)
}

function classifyEvidenceStrength(
  currentVisitorsPerVariant: number,
  requiredVisitorsPerVariant: number
): EvidenceStrength {
  const ratio = currentVisitorsPerVariant / Math.max(requiredVisitorsPerVariant, 1)

  if (ratio < 0.5) {
    return "Low"
  }

  if (ratio < 1) {
    return "Moderate"
  }

  return "Strong"
}

function classifyExperimentMaturity(
  currentVisitorsPerVariant: number,
  requiredVisitorsPerVariant: number
): {
  experimentMaturity: ExperimentMaturity
  maturityProgress: number
} {
  const progress = clamp(
    currentVisitorsPerVariant / Math.max(requiredVisitorsPerVariant, 1),
    0,
    1
  )

  if (progress < 0.35) {
    return {
      experimentMaturity: "Early",
      maturityProgress: progress,
    }
  }

  if (progress < 0.85) {
    return {
      experimentMaturity: "Building",
      maturityProgress: progress,
    }
  }

  return {
    experimentMaturity: "Mature",
    maturityProgress: progress,
  }
}

function determineDecisionStatus({
  probabilityMeaningfulLift,
  probabilityMeaningfulHarm,
  decisionThreshold,
  evidenceStrength,
}: {
  probabilityMeaningfulLift: number
  probabilityMeaningfulHarm: number
  decisionThreshold: number
  evidenceStrength: EvidenceStrength
}): AnalysisResult["decisionStatus"] {
  if (probabilityMeaningfulLift >= decisionThreshold) {
    return "Ship Variant B"
  }

  if (probabilityMeaningfulHarm >= decisionThreshold) {
    return "Keep Variant A"
  }

  if (evidenceStrength === "Low") {
    return "Continue test"
  }

  return "Inconclusive"
}

function calculateAnalysis({
  visitorsA,
  conversionsA,
  visitorsB,
  conversionsB,
  priorAlpha,
  priorBeta,
  decisionThreshold,
  meaningfulLift,
}: {
  visitorsA: number
  conversionsA: number
  visitorsB: number
  conversionsB: number
  priorAlpha: number
  priorBeta: number
  decisionThreshold: number
  meaningfulLift: number
}): AnalysisResult {
  const posteriorAlphaA = priorAlpha + conversionsA
  const posteriorBetaA = priorBeta + (visitorsA - conversionsA)
  const posteriorAlphaB = priorAlpha + conversionsB
  const posteriorBetaB = priorBeta + (visitorsB - conversionsB)
  const observedRateA = conversionsA / visitorsA
  const observedRateB = conversionsB / visitorsB
  const posteriorMeanA = posteriorAlphaA / (posteriorAlphaA + posteriorBetaA)
  const posteriorMeanB = posteriorAlphaB / (posteriorAlphaB + posteriorBetaB)
  const probabilityBBeatsA = clamp(
    probabilityVariantBBeatsA({
      alphaA: posteriorAlphaA,
      betaA: posteriorBetaA,
      alphaB: posteriorAlphaB,
      betaB: posteriorBetaB,
    }),
    0,
    1
  )
  const probabilityABeatsB = 1 - probabilityBBeatsA
  const random = makeDeterministicRandom(
    posteriorAlphaA +
      posteriorBetaA * 3 +
      posteriorAlphaB * 5 +
      posteriorBetaB * 7
  )
  const samplesA = Array.from({ length: MONTE_CARLO_SAMPLES }, () =>
    sampleBeta(posteriorAlphaA, posteriorBetaA, random)
  )
  const samplesB = Array.from({ length: MONTE_CARLO_SAMPLES }, () =>
    sampleBeta(posteriorAlphaB, posteriorBetaB, random)
  )
  const relativeLifts = samplesA.map((sampleA, index) => samplesB[index] / sampleA - 1)
  const absoluteDiffs = samplesA.map((sampleA, index) => samplesB[index] - sampleA)
  const sortedRelativeLifts = [...relativeLifts].sort((left, right) => left - right)
  const sortedAbsoluteDiffs = [...absoluteDiffs].sort((left, right) => left - right)
  const expectedLossIfShipA = mean(absoluteDiffs.map((difference) => Math.max(difference, 0)))
  const expectedLossIfShipB = mean(absoluteDiffs.map((difference) => Math.max(-difference, 0)))
  const visitorsPerVariant = Math.round((visitorsA + visitorsB) / 2)
  const totalConversions = conversionsA + conversionsB
  const recommendedConversionsPerVariant = 200
  const baselineRate = (posteriorMeanA + posteriorMeanB) / 2
  const requiredVisitorsPerVariant = calculateRequiredSamplePerVariant({
    baselineRate,
    meaningfulLift,
  })
  const additionalVisitorsForStableEstimate = Math.max(
    0,
    requiredVisitorsPerVariant - Math.min(visitorsA, visitorsB)
  )
  const evidenceStrength = classifyEvidenceStrength(
    Math.min(visitorsA, visitorsB),
    requiredVisitorsPerVariant
  )
  const { experimentMaturity, maturityProgress } = classifyExperimentMaturity(
    Math.min(visitorsA, visitorsB),
    requiredVisitorsPerVariant
  )
  const decisionStatus = determineDecisionStatus({
    probabilityMeaningfulLift: mean(
      relativeLifts.map((lift) => (lift > meaningfulLift ? 1 : 0))
    ),
    probabilityMeaningfulHarm: mean(
      relativeLifts.map((lift) => (lift < -meaningfulLift ? 1 : 0))
    ),
    decisionThreshold,
    evidenceStrength,
  })

  return {
    posteriorAlphaA,
    posteriorBetaA,
    posteriorAlphaB,
    posteriorBetaB,
    observedRateA,
    observedRateB,
    posteriorMeanA,
    posteriorMeanB,
    probabilityBBeatsA,
    probabilityABeatsB,
    probabilityMeaningfulLift: mean(
      relativeLifts.map((lift) => (lift > meaningfulLift ? 1 : 0))
    ),
    probabilityMeaningfulHarm: mean(
      relativeLifts.map((lift) => (lift < -meaningfulLift ? 1 : 0))
    ),
    probabilityImprovesOnePercent: mean(
      relativeLifts.map((lift) => (lift > 0.01 ? 1 : 0))
    ),
    probabilityImprovesFivePercent: mean(
      relativeLifts.map((lift) => (lift > 0.05 ? 1 : 0))
    ),
    probabilityHarmFivePercent: mean(
      relativeLifts.map((lift) => (lift < -0.05 ? 1 : 0))
    ),
    probabilityHarmTenPercent: mean(
      relativeLifts.map((lift) => (lift < -0.1 ? 1 : 0))
    ),
    probabilityTreatmentHarmful: mean(
      relativeLifts.map((lift) => (lift < 0 ? 1 : 0))
    ),
    expectedLossIfShipA,
    expectedLossIfShipB,
    observedAbsoluteDifference: observedRateB - observedRateA,
    posteriorAbsoluteDifference: posteriorMeanB - posteriorMeanA,
    observedRelativeLift:
      observedRateA > 0 ? observedRateB / observedRateA - 1 : null,
    posteriorRelativeLift: posteriorMeanB / posteriorMeanA - 1,
    liftCredibleIntervalLower: quantile(sortedRelativeLifts, 0.025),
    liftCredibleIntervalUpper: quantile(sortedRelativeLifts, 0.975),
    absoluteDiffCredibleIntervalLower: quantile(sortedAbsoluteDiffs, 0.025),
    absoluteDiffCredibleIntervalUpper: quantile(sortedAbsoluteDiffs, 0.975),
    pValueTwoSided: calculateTwoSidedPValue({
      visitorsA,
      conversionsA,
      visitorsB,
      conversionsB,
    }),
    chartData: createPosteriorChartData({
      posteriorAlphaA,
      posteriorBetaA,
      posteriorAlphaB,
      posteriorBetaB,
      samplesA,
      samplesB,
    }),
    visitorsPerVariant,
    totalConversions,
    recommendedConversionsPerVariant,
    additionalVisitorsForStableEstimate,
    detectableEffectRelative:
      ((inverseNormalCdf(1 - 0.05 / 2) + inverseNormalCdf(0.8)) *
        Math.sqrt(2 * baselineRate * (1 - baselineRate) / Math.min(visitorsA, visitorsB))) /
      baselineRate,
    evidenceStrength,
    experimentMaturity,
    maturityProgress,
    decisionStatus,
  }
}

function getInitialInputs(): Inputs {
  return {
    visitorsA: "12000",
    conversionsA: "660",
    visitorsB: "11850",
    conversionsB: "714",
    priorAlpha: "1",
    priorBeta: "1",
    thresholdPercent: "95",
    meaningfulLiftPercent: "10",
  }
}

function getInitialResult(): AnalysisResult {
  return calculateAnalysis({
    visitorsA: 12000,
    conversionsA: 660,
    visitorsB: 11850,
    conversionsB: 714,
    priorAlpha: 1,
    priorBeta: 1,
    decisionThreshold: 0.95,
    meaningfulLift: 0.1,
  })
}

export default function BayesianAbTestPage() {
  const [inputs, setInputs] = React.useState<Inputs>(getInitialInputs)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<AnalysisResult>(getInitialResult)

  const meaningfulLiftPercent = parsePercent(inputs.meaningfulLiftPercent)
  const meaningfulLift =
    meaningfulLiftPercent === null ? 0.1 : meaningfulLiftPercent / 100

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const visitorsA = parsePositiveWholeNumber(inputs.visitorsA)
    const conversionsA = parseWholeNumber(inputs.conversionsA)
    const visitorsB = parsePositiveWholeNumber(inputs.visitorsB)
    const conversionsB = parseWholeNumber(inputs.conversionsB)
    const priorAlpha = parsePositiveWholeNumber(inputs.priorAlpha)
    const priorBeta = parsePositiveWholeNumber(inputs.priorBeta)
    const decisionThreshold = parsePercent(inputs.thresholdPercent)
    const practicalThreshold = parsePercent(inputs.meaningfulLiftPercent)

    if (
      visitorsA === null ||
      conversionsA === null ||
      visitorsB === null ||
      conversionsB === null ||
      priorAlpha === null ||
      priorBeta === null
    ) {
      setError("Traffic, conversions, and prior parameters must be whole numbers.")
      return
    }

    if (conversionsA > visitorsA || conversionsB > visitorsB) {
      setError("Conversions cannot exceed visitors.")
      return
    }

    if (
      decisionThreshold === null ||
      decisionThreshold <= 50 ||
      decisionThreshold >= 100
    ) {
      setError("Decision threshold must be a percent between 50 and 100.")
      return
    }

    if (
      practicalThreshold === null ||
      practicalThreshold < 0 ||
      practicalThreshold >= 100
    ) {
      setError("Minimum meaningful lift must be a percent between 0 and 100.")
      return
    }

    setError(null)
    setResult(
      calculateAnalysis({
        visitorsA,
        conversionsA,
        visitorsB,
        conversionsB,
        priorAlpha,
        priorBeta,
        decisionThreshold: decisionThreshold / 100,
        meaningfulLift: practicalThreshold / 100,
      })
    )
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold">Bayesian A/B Test Calculator</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Enter visitors and conversions for variants A and B. The tool models
            each conversion rate with a Beta posterior, computes the closed-form
            probability that B beats A, and adds decision metrics for business
            relevance, downside risk, and sequential monitoring.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            In this tool, the meaningful effect threshold is symmetric: it applies
            to both meaningful lift and meaningful loss. It is a relative threshold,
            not an absolute percentage-point change. Example: `10%` means B must be
            at least 10% better than A to count as a meaningful gain, or 10% worse
            than A to count as a meaningful loss. A 10.00% baseline would therefore
            map to about 11.00% on the upside or 9.00% on the downside.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Source:{" "}
            <a
              className="underline underline-offset-4"
              href="https://www.evanmiller.org/bayesian-ab-testing.html"
              rel="noreferrer"
              target="_blank"
            >
              Evan Miller, Bayesian A/B Testing
            </a>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <Card className="xl:sticky xl:top-24">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
              <CardDescription>
                Binary conversion outcomes only: signup, click, purchase, or any
                other success/failure event.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pb-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="grid gap-2">
                  <Label htmlFor="visitors-a">Variant A visitors</Label>
                  <Input
                    id="visitors-a"
                    type="text"
                    inputMode="numeric"
                    value={inputs.visitorsA ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        visitorsA: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conversions-a">Variant A conversions</Label>
                  <Input
                    id="conversions-a"
                    type="text"
                    inputMode="numeric"
                    value={inputs.conversionsA ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        conversionsA: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="visitors-b">Variant B visitors</Label>
                  <Input
                    id="visitors-b"
                    type="text"
                    inputMode="numeric"
                    value={inputs.visitorsB ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        visitorsB: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="conversions-b">Variant B conversions</Label>
                  <Input
                    id="conversions-b"
                    type="text"
                    inputMode="numeric"
                    value={inputs.conversionsB ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        conversionsB: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="grid gap-2">
                  <Label htmlFor="prior-alpha">Prior alpha</Label>
                  <Input
                    id="prior-alpha"
                    type="text"
                    inputMode="numeric"
                    value={inputs.priorAlpha ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        priorAlpha: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prior-beta">Prior beta</Label>
                  <Input
                    id="prior-beta"
                    type="text"
                    inputMode="numeric"
                    value={inputs.priorBeta ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        priorBeta: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="threshold">Decision threshold %</Label>
                  <Input
                    id="threshold"
                    type="text"
                    inputMode="decimal"
                    value={inputs.thresholdPercent ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        thresholdPercent: event.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Threshold for shipping or keeping based on posterior probability.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meaningful-lift">
                    Minimum meaningful relative effect %
                  </Label>
                  <Input
                    id="meaningful-lift"
                    type="text"
                    inputMode="decimal"
                    value={inputs.meaningfulLiftPercent ?? ""}
                    onChange={(event) =>
                      setInputs((previous) => ({
                        ...previous,
                        meaningfulLiftPercent: event.target.value,
                      }))
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Symmetric relative threshold used for both meaningful upside and
                    meaningful downside. Example: `10` means at least 10% better or
                    10% worse than A, not 10 percentage points.
                  </p>
                </div>
              </div>

              <Button type="submit">Update Bayesian Readout</Button>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </CardContent>
          </Card>

          <div className="grid gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Decision Summary</CardTitle>
                  <CardDescription>
                    Posterior win probability, practical significance, and status.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Decision status</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {result.decisionStatus}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Evidence strength</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {result.evidenceStrength}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Experiment maturity</p>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="text-2xl font-semibold">
                          {result.experimentMaturity}
                        </p>
                        <Badge variant="outline">
                          {formatPercent(result.maturityProgress, 0)} of target
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Probability B beats A</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatPercent(result.probabilityBBeatsA)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Probability A beats B: {formatPercent(result.probabilityABeatsB)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Probability relative lift &gt; {formatPercent(meaningfulLift, 0)}:{" "}
                      {formatPercent(result.probabilityMeaningfulLift)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Probability relative lift &lt; -{formatPercent(meaningfulLift, 0)}:{" "}
                      {formatPercent(result.probabilityMeaningfulHarm)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Effect Size</CardTitle>
                  <CardDescription>
                    Absolute and relative effect with credible intervals.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Estimated lift</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatRelativeLift(result.posteriorRelativeLift)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      95% credible interval:{" "}
                      {formatRelativeLift(result.liftCredibleIntervalLower)} to{" "}
                      {formatRelativeLift(result.liftCredibleIntervalUpper)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Absolute difference</p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatPercentagePoints(result.posteriorAbsoluteDifference)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        95% credible interval:{" "}
                        {formatPercentagePoints(
                          result.absoluteDiffCredibleIntervalLower
                        )}{" "}
                        to{" "}
                        {formatPercentagePoints(
                          result.absoluteDiffCredibleIntervalUpper
                        )}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Observed difference</p>
                      <p className="mt-2 text-xl font-semibold">
                        {formatPercentagePoints(result.observedAbsoluteDifference)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Relative: {formatRelativeLift(result.observedRelativeLift)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Posterior Distributions</CardTitle>
                <CardDescription>
                  The overlap shows where the two plausible conversion-rate ranges still
                  agree.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pb-4">
                <ChartContainer config={POSTERIOR_CHART_CONFIG} preset="terminal">
                  <ComposedChart data={result.chartData}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="conversionRatePercent"
                      tickFormatter={(value: number) => `${value.toFixed(1)}%`}
                      minTickGap={24}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={({ active, label, payload }) => (
                        <ChartTooltipContent
                          active={active}
                          label={label}
                          payload={payload}
                          formatter={(value) =>
                            typeof value === "number" ? value.toFixed(1) : value
                          }
                          labelFormatter={(label) =>
                            `Conversion rate ${Number(label).toFixed(2)}%`
                          }
                        />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey="overlap"
                      fill="var(--color-overlap)"
                      fillOpacity={0.7}
                      stroke="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="variantA"
                      stroke="var(--color-variantA)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="variantB"
                      stroke="var(--color-variantB)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Risk and Loss</CardTitle>
                  <CardDescription>
                    Downside probabilities plus expected cost of shipping the wrong
                    version.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Expected loss if shipping B</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatPercent(result.expectedLossIfShipB)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Average conversion-rate regret from choosing B.
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Expected loss if shipping A</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatPercent(result.expectedLossIfShipA)}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Average conversion-rate regret from choosing A.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Probability treatment is harmful</p>
                    <p className="mt-2 text-3xl font-semibold">
                      {formatPercent(result.probabilityTreatmentHarmful)}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Probability harm &gt; 5%: {formatPercent(result.probabilityHarmFivePercent)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Probability harm &gt; 10%: {formatPercent(result.probabilityHarmTenPercent)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Probability relative harm &gt; {formatPercent(meaningfulLift, 0)}:{" "}
                      {formatPercent(result.probabilityMeaningfulHarm)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Meaningful Impact</CardTitle>
                  <CardDescription>
                    Threshold-based probabilities translated into business terms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      Probability B improves conversion &gt; 1%
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatPercent(result.probabilityImprovesOnePercent)}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Probability B improves conversion &gt; 5%
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatPercent(result.probabilityImprovesFivePercent)}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Probability B reduces conversion &gt; 5%
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatPercent(result.probabilityHarmFivePercent)}
                    </p>
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm text-muted-foreground">
                      Probability relative lift &gt; {formatPercent(meaningfulLift, 0)}
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {formatPercent(result.probabilityMeaningfulLift)}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Probability relative lift &lt; -{formatPercent(meaningfulLift, 0)}
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatPercent(result.probabilityMeaningfulHarm)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sample Size Context</CardTitle>
                  <CardDescription>
                    Current maturity, practical target, and estimated remaining data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Visitors per variant</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCount(result.visitorsPerVariant)}
                      </p>
                    </div>
                    <div className="rounded-md border border-border p-4">
                      <p className="text-sm font-medium">Total conversions</p>
                      <p className="mt-2 text-2xl font-semibold">
                        {formatCount(result.totalConversions)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Sequential monitoring guidance</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-[width]"
                        style={{ width: `${(result.maturityProgress * 100).toFixed(0)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Recommended conversions per variant: ~
                      {formatCount(result.recommendedConversionsPerVariant)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Estimated additional visitors for a stable estimate: ~
                      {formatCount(result.additionalVisitorsForStableEstimate)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Smallest detectable effect with current sample: ~
                      {formatPercent(result.detectableEffectRelative, 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistical Context</CardTitle>
                  <CardDescription>
                    A familiar frequentist reference point next to the Bayesian readout.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pb-4">
                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Null reference</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      If there were no real difference, a result this extreme would occur
                      about {formatPercent(result.pValueTwoSided)} of the time.
                    </p>
                  </div>

                  <div className="rounded-md border border-border p-4">
                    <p className="text-sm font-medium">Posterior means</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Variant A: {formatPercent(result.posteriorMeanA, 3)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Variant B: {formatPercent(result.posteriorMeanB, 3)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Beta A: ({formatCount(result.posteriorAlphaA)},{" "}
                      {formatCount(result.posteriorBetaA)}) and Beta B: (
                      {formatCount(result.posteriorAlphaB)},{" "}
                      {formatCount(result.posteriorBetaB)})
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </section>
    </div>
  )
}
