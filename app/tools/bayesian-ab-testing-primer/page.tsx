"use client"

import * as React from "react"
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  type ChartConfig,
} from "@/shared/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"

type BetaChartPoint = {
  probability: number
  density: number
}

type ChartRange<TPoint> = {
  maxDensity: number
  points: TPoint[]
}

type OverlayChartPoint = {
  probability: number
  n100: number
  n500: number
  n2000: number
}

type AbChartPoint = {
  probability: number
  control: number
  variant: number
}

type AbComparisonResult = {
  points: AbChartPoint[]
  maxDensity: number
  probBBeatsA: number
}

type LossCurvePoint = {
  n: number
  lossChooseA: number
  lossChooseB: number
}

function InlineMath({ children }: { children: React.ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[1.05em] text-foreground">
      {children}
    </span>
  )
}

function MathBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70 bg-muted/25 px-4 py-3 text-[1.15rem] text-foreground md:text-[1.3rem]">
      {children}
    </div>
  )
}

const BETA_CHART_CONFIG = {
  density: {
    label: "Beta density",
    theme: {
      light: "oklch(0.56 0.18 251)",
      dark: "oklch(0.74 0.12 251)",
      terminal: "rgb(166 206 255)",
    },
  },
  fill: {
    label: "Area under curve",
    theme: {
      light: "oklch(0.78 0.05 245)",
      dark: "oklch(0.58 0.04 245)",
      terminal: "rgb(84 114 148)",
    },
  },
} satisfies ChartConfig

const SECTION_TWO_CHART_CONFIG = {
  n100: {
    label: "N = 100",
    theme: {
      light: "oklch(0.68 0.18 55)",
      dark: "oklch(0.76 0.15 55)",
      terminal: "rgb(245 158 11)",
    },
  },
  n100Fill: {
    label: "N = 100 fill",
    theme: {
      light: "oklch(0.88 0.08 55 / 0.45)",
      dark: "oklch(0.45 0.09 55 / 0.5)",
      terminal: "rgba(245 158 11 / 0.18)",
    },
  },
  n500: {
    label: "N = 500",
    theme: {
      light: "oklch(0.64 0.14 190)",
      dark: "oklch(0.74 0.12 190)",
      terminal: "rgb(20 184 166)",
    },
  },
  n500Fill: {
    label: "N = 500 fill",
    theme: {
      light: "oklch(0.84 0.06 190 / 0.4)",
      dark: "oklch(0.44 0.07 190 / 0.5)",
      terminal: "rgba(20 184 166 / 0.16)",
    },
  },
  n2000: {
    label: "N = 2,000",
    theme: {
      light: "oklch(0.6 0.2 15)",
      dark: "oklch(0.7 0.16 15)",
      terminal: "rgb(244 63 94)",
    },
  },
  n2000Fill: {
    label: "N = 2,000 fill",
    theme: {
      light: "oklch(0.8 0.08 15 / 0.36)",
      dark: "oklch(0.4 0.08 15 / 0.48)",
      terminal: "rgba(244 63 94 / 0.14)",
    },
  },
} satisfies ChartConfig

const SECTION_THREE_CHART_CONFIG = {
  control: {
    label: "Control (A)",
    theme: {
      light: "oklch(0.6 0.15 240)",
      dark: "oklch(0.74 0.12 240)",
      terminal: "rgb(99 179 237)",
    },
  },
  controlFill: {
    label: "Control fill",
    theme: {
      light: "oklch(0.82 0.06 240 / 0.4)",
      dark: "oklch(0.45 0.07 240 / 0.5)",
      terminal: "rgb(99 179 237 / 0.18)",
    },
  },
  variant: {
    label: "Variant (B)",
    theme: {
      light: "oklch(0.68 0.18 45)",
      dark: "oklch(0.76 0.15 45)",
      terminal: "rgb(252 129 74)",
    },
  },
  variantFill: {
    label: "Variant fill",
    theme: {
      light: "oklch(0.88 0.08 45 / 0.4)",
      dark: "oklch(0.46 0.09 45 / 0.5)",
      terminal: "rgb(252 129 74 / 0.18)",
    },
  },
} satisfies ChartConfig

const SECTION_FIVE_CHART_CONFIG = {
  lossChooseA: {
    label: "Hold A",
    theme: {
      light: "oklch(0.6 0.15 240)",
      dark: "oklch(0.74 0.12 240)",
      terminal: "rgb(99 179 237)",
    },
  },
  lossChooseB: {
    label: "Ship B",
    theme: {
      light: "oklch(0.68 0.18 45)",
      dark: "oklch(0.76 0.15 45)",
      terminal: "rgb(252 129 74)",
    },
  },
} satisfies ChartConfig

const WORKED_EXAMPLE_WEEKS = [
  { week: 1, nPerVariant: 250,  controlSuccesses: 9,  variantSuccesses: 22 },
  { week: 2, nPerVariant: 500,  controlSuccesses: 27, variantSuccesses: 33 },
  { week: 3, nPerVariant: 750,  controlSuccesses: 46, variantSuccesses: 43 },
  { week: 4, nPerVariant: 1000, controlSuccesses: 60, variantSuccesses: 57 },
  { week: 5, nPerVariant: 1250, controlSuccesses: 72, variantSuccesses: 76 },
  { week: 6, nPerVariant: 1500, controlSuccesses: 84, variantSuccesses: 93 },
] as const

const EXAMPLE_NARRATIVES = [
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

function createBetaChartData(alpha: number, beta: number): BetaChartPoint[] {
  return Array.from({ length: CHART_POINTS }, (_, index) => {
    const probability = index / (CHART_POINTS - 1)
    const interiorProbability = clamp(probability, 1e-4, 1 - 1e-4)

    return {
      probability,
      density: clamp(betaPdf(interiorProbability, alpha, beta), 0, 12),
    }
  })
}

function createOverlayBetaChartData(
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

function createAbComparisonData(
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

function computeExpectedLoss(
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

function createLossCurveData(
  controlRate: number,
  variantRate: number,
  currentN: number
): LossCurvePoint[] {
  const maxN = currentN + Math.max(currentN * 4, 1000)
  const POINTS = 40
  return Array.from({ length: POINTS }, (_, index) => {
    const n = Math.round(currentN + ((maxN - currentN) * index) / (POINTS - 1))
    const controlSuccesses = Math.round(n * controlRate)
    const variantSuccesses = Math.round(n * variantRate)
    const { lossChooseA, lossChooseB } = computeExpectedLoss(
      1 + controlSuccesses,
      1 + (n - controlSuccesses),
      1 + variantSuccesses,
      1 + (n - variantSuccesses)
    )
    return { n, lossChooseA: lossChooseA * 100, lossChooseB: lossChooseB * 100 }
  })
}

function formatProbability(value: number): string {
  return value.toFixed(2)
}

function formatSliderValue(value: number): string {
  return value.toFixed(1)
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

export default function BayesianAbTestingPrimerPage() {
  const [alpha, setAlpha] = React.useState(1)
  const [beta, setBeta] = React.useState(1)
  const [abControlRate, setAbControlRate] = React.useState(5)
  const [abVariantRate, setAbVariantRate] = React.useState(7)
  const [abN, setAbN] = React.useState(500)
  const [s4ControlRate, setS4ControlRate] = React.useState(5)
  const [s4VariantRate, setS4VariantRate] = React.useState(7)
  const [s4N, setS4N] = React.useState(500)
  const [s5ControlRate, setS5ControlRate] = React.useState(5)
  const [s5VariantRate, setS5VariantRate] = React.useState(7)
  const [s5N, setS5N] = React.useState(200)
  const [s6Week, setS6Week] = React.useState(1)

  const chartData = React.useMemo(() => createBetaChartData(alpha, beta), [alpha, beta])
  const sectionTwoSamples = React.useMemo(
    () =>
      [
        { n: 100, strokeColor: "rgb(245, 158, 11)", fillColor: "rgba(245, 158, 11, 0.18)" },
        { n: 500, strokeColor: "rgb(20, 184, 166)", fillColor: "rgba(20, 184, 166, 0.16)" },
        { n: 2000, strokeColor: "rgb(244, 63, 94)", fillColor: "rgba(244, 63, 94, 0.14)" },
      ].map(({ n, strokeColor, fillColor }) => {
        const successes = Math.round(n * 0.05)
        const failures = n - successes
        return {
          n,
          successes,
          failures,
          alpha: 1 + successes,
          beta: 1 + failures,
          strokeColor,
          fillColor,
        }
      }),
    []
  )
  const sectionTwoChart = React.useMemo(
    () =>
      createOverlayBetaChartData([
        {
          key: "n100",
          alpha: sectionTwoSamples[0].alpha,
          beta: sectionTwoSamples[0].beta,
        },
        {
          key: "n500",
          alpha: sectionTwoSamples[1].alpha,
          beta: sectionTwoSamples[1].beta,
        },
        {
          key: "n2000",
          alpha: sectionTwoSamples[2].alpha,
          beta: sectionTwoSamples[2].beta,
        },
      ]),
    [sectionTwoSamples]
  )
  const sectionThree = React.useMemo(() => {
    const controlSuccesses = Math.round(abN * (abControlRate / 100))
    const variantSuccesses = Math.round(abN * (abVariantRate / 100))
    return createAbComparisonData(
      1 + controlSuccesses,
      1 + (abN - controlSuccesses),
      1 + variantSuccesses,
      1 + (abN - variantSuccesses)
    )
  }, [abControlRate, abVariantRate, abN])
  const sectionFour = React.useMemo(() => {
    const controlSuccesses = Math.round(s4N * (s4ControlRate / 100))
    const variantSuccesses = Math.round(s4N * (s4VariantRate / 100))
    const alphaA = 1 + controlSuccesses
    const betaA = 1 + (s4N - controlSuccesses)
    const alphaB = 1 + variantSuccesses
    const betaB = 1 + (s4N - variantSuccesses)
    const chart = createAbComparisonData(alphaA, betaA, alphaB, betaB)
    const loss = computeExpectedLoss(alphaA, betaA, alphaB, betaB)
    return { ...chart, ...loss }
  }, [s4ControlRate, s4VariantRate, s4N])
  const sectionFive = React.useMemo(
    () => createLossCurveData(s5ControlRate / 100, s5VariantRate / 100, s5N),
    [s5ControlRate, s5VariantRate, s5N]
  )
  const sectionSix = React.useMemo(() => {
    const data = WORKED_EXAMPLE_WEEKS[s6Week - 1]
    const alphaA = 1 + data.controlSuccesses
    const betaA = 1 + data.nPerVariant - data.controlSuccesses
    const alphaB = 1 + data.variantSuccesses
    const betaB = 1 + data.nPerVariant - data.variantSuccesses
    const chart = createAbComparisonData(alphaA, betaA, alphaB, betaB)
    const loss = computeExpectedLoss(alphaA, betaA, alphaB, betaB)
    return { ...chart, ...loss, data, narrative: EXAMPLE_NARRATIVES[s6Week - 1] }
  }, [s6Week])

  return (
    <div className="min-h-screen bg-background pt-16">
      <article className="mx-auto max-w-5xl px-6 py-8">
        <header className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            BABTP
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Bayesian AB Testing Primer
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Section 1 starts with the workhorse of Bayesian A/B testing: the Beta
            distribution. It is the standard prior and posterior for a conversion
            probability because it is flexible, bounded between 0 and 1, and it
            updates cleanly after observing successes and failures.
          </p>
        </header>

        <section className="mt-12 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 1
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              The Beta distribution
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              The density is:
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>f</mi>
                  <mo>(</mo>
                  <mi>p</mi>
                  <mo>;</mo>
                  <mi>&alpha;</mi>
                  <mo>,</mo>
                  <mi>&beta;</mi>
                  <mo>)</mo>
                  <mo>=</mo>
                  <mfrac>
                    <mrow>
                      <msup>
                        <mi>p</mi>
                        <mrow>
                          <mi>&alpha;</mi>
                          <mo>-</mo>
                          <mn>1</mn>
                        </mrow>
                      </msup>
                      <msup>
                        <mrow>
                          <mo>(</mo>
                          <mn>1</mn>
                          <mo>-</mo>
                          <mi>p</mi>
                          <mo>)</mo>
                        </mrow>
                        <mrow>
                          <mi>&beta;</mi>
                          <mo>-</mo>
                          <mn>1</mn>
                        </mrow>
                      </msup>
                    </mrow>
                    <mrow>
                      <mi>B</mi>
                      <mo>(</mo>
                      <mi>&alpha;</mi>
                      <mo>,</mo>
                      <mi>&beta;</mi>
                      <mo>)</mo>
                    </mrow>
                  </mfrac>
                </mrow>
              </math>
            </MathBlock>
            <p>
              Here, <InlineMath>p</InlineMath> is a probability between 0 and 1, and{" "}
              <InlineMath>
                <span>&alpha;</span>
              </InlineMath>{" "}
              plus{" "}
              <InlineMath>
                <span>&beta;</span>
              </InlineMath>{" "}
              are the shape parameters.
            </p>
            <p>
              The normalizing term{" "}
              <InlineMath>
                <span>B(&alpha;, &beta;)</span>
              </InlineMath>{" "}
              is the Beta function. It comes from classical analysis and is defined by
              an integral over the unit interval. In plain terms, it is the constant
              that makes the total area under the curve equal exactly 1, so the
              curve is a valid probability distribution.
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>B</mi>
                  <mo>(</mo>
                  <mi>&alpha;</mi>
                  <mo>,</mo>
                  <mi>&beta;</mi>
                  <mo>)</mo>
                  <mo>=</mo>
                  <msubsup>
                    <mo>&#x222B;</mo>
                    <mn>0</mn>
                    <mn>1</mn>
                  </msubsup>
                  <msup>
                    <mi>t</mi>
                    <mrow>
                      <mi>&alpha;</mi>
                      <mo>-</mo>
                      <mn>1</mn>
                    </mrow>
                  </msup>
                  <msup>
                    <mrow>
                      <mo>(</mo>
                      <mn>1</mn>
                      <mo>-</mo>
                      <mi>t</mi>
                      <mo>)</mo>
                    </mrow>
                    <mrow>
                      <mi>&beta;</mi>
                      <mo>-</mo>
                      <mn>1</mn>
                    </mrow>
                  </msup>
                  <mspace width="0.4em" />
                  <mi>d</mi>
                  <mi>t</mi>
                </mrow>
              </math>
            </MathBlock>
            <p>
              In Bayesian A/B testing, α and β control the shape. A larger α pulls
              belief toward higher conversion probabilities. A larger β pulls belief
              toward lower ones. When both are 1, the distribution is flat, which is
              why <InlineMath>Beta(1, 1)</InlineMath> is often treated as a
              neutral starting point.
            </p>
            <p>
              Historically, the Beta distribution became central to Bayesian binomial
              modeling because it is conjugate to the Bernoulli and binomial
              likelihoods. That means the posterior stays Beta after you observe data.
              If you start with{" "}
              <InlineMath>Beta(&alpha;, &beta;)</InlineMath> and then observe
              successes and failures, the updated posterior is:
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>Beta</mi>
                  <mo>(</mo>
                  <mi>&alpha;</mi>
                  <mo>+</mo>
                  <mi>successes</mi>
                  <mo>,</mo>
                  <mi>&beta;</mi>
                  <mo>+</mo>
                  <mi>failures</mi>
                  <mo>)</mo>
                </mrow>
              </math>
            </MathBlock>
          </div>
        </section>

        <section className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Beta curve</CardTitle>
              <CardDescription>
                The shaded region is the full area under the density curve. That area
                always sums to 1.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={BETA_CHART_CONFIG}>
                <ComposedChart data={chartData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="probability"
                    tickFormatter={(value: number) => value.toFixed(1)}
                    minTickGap={24}
                  />
                  <YAxis width={40} />
                  <Area
                    type="monotone"
                    dataKey="density"
                    fill="var(--color-fill)"
                    fillOpacity={0.75}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="density"
                    stroke="var(--color-density)"
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shape controls</CardTitle>
              <CardDescription>
                Start from Beta(1, 1) and move the parameters to see how the curve
                changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pb-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="beta-alpha">Alpha</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatSliderValue(alpha)}
                  </span>
                </div>
                <Slider
                  id="beta-alpha"
                  min={1}
                  max={12}
                  step={0.5}
                  value={alpha}
                  onValueChange={setAlpha}
                />
                <p className="text-xs text-muted-foreground">
                  Higher alpha shifts mass toward the right side of the chart.
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="beta-beta">Beta</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatSliderValue(beta)}
                  </span>
                </div>
                <Slider
                  id="beta-beta"
                  min={1}
                  max={12}
                  step={0.5}
                  value={beta}
                  onValueChange={setBeta}
                />
                <p className="text-xs text-muted-foreground">
                  Higher beta shifts mass toward the left side of the chart.
                </p>
              </div>

              <div className="rounded-md border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Current prior: Beta({formatProbability(alpha)}, {formatProbability(beta)})
                </p>
                <p className="mt-2">
                  Use equal values above 1 to concentrate belief around the middle.
                  Make one parameter much larger than the other to bias the
                  distribution toward 0 or 1.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            Why this matters for A/B testing
          </h3>
          <p>
            A conversion rate is a probability, so we want a distribution defined on
            probabilities. The Beta family gives us a compact language for prior
            belief and an easy update rule after data arrives. That is why Bayesian
            A/B testing almost always starts here.
          </p>
          <p>
            In the next sections, this primer can build from the shape of the Beta
            curve into posterior updating, probability that B beats A, and decision
            costs under uncertainty.
          </p>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 2
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              From Beta shape to conversion data
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              In an A/B test, α and β stop feeling abstract as soon as you connect
              them to outcomes. For a binary event like conversion, a simple starting
              point is a neutral prior of Beta(1, 1). After observing data, you add
              successes to α and failures to β.
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>&alpha;</mi>
                  <mo>=</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mi>successes</mi>
                  <mspace width="1.2em" />
                  <mi>&beta;</mi>
                  <mo>=</mo>
                  <mn>1</mn>
                  <mo>+</mo>
                  <mi>failures</mi>
                </mrow>
              </math>
            </MathBlock>
            <p>
              That means α is the success side of the story and β is the failure
              side. If conversions are rare, β will grow much faster than α. If the
              conversion rate is high, α catches up. As sample size grows, the curve
              gets narrower because the posterior becomes more certain.
            </p>
            <p>
              To make the squeezing effect obvious, hold the conversion rate fixed at
              5% and compare three sample sizes. As N grows, the posterior keeps the
              same center but becomes much narrower.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <Card>
            <CardHeader>
              <CardTitle>Posterior from conversions</CardTitle>
              <CardDescription>
                Same conversion rate, different sample sizes. All three posteriors use
                a Beta(1, 1) prior and a 5% observed conversion rate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
              <ChartContainer config={SECTION_TWO_CHART_CONFIG}>
                <ComposedChart data={sectionTwoChart.points}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="probability"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    minTickGap={24}
                  />
                  <YAxis
                    hide
                    domain={[0, Math.max(1, sectionTwoChart.maxDensity * 1.1)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="n100"
                    fill="var(--color-n100Fill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="n500"
                    fill="var(--color-n500Fill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="n2000"
                    fill="var(--color-n2000Fill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="n100"
                    stroke="var(--color-n100)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="n500"
                    stroke="var(--color-n500)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="n2000"
                    stroke="var(--color-n2000)"
                    strokeWidth={3}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
              <div className="grid gap-2 md:grid-cols-3">
                {sectionTwoSamples.map((sample) => (
                  <div
                    key={sample.n}
                    className="overflow-hidden rounded-lg border border-border/70 bg-muted/25 text-sm text-muted-foreground"
                  >
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: sample.strokeColor }}
                    />
                    <div className="space-y-2 p-2.5">
                      <p className="font-semibold text-foreground">
                        N = {formatCount(sample.n)}
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px] leading-5">
                        <div className="min-w-0 whitespace-nowrap">
                          <span>Successes: </span>
                          <span className="font-medium text-foreground">
                            {formatCount(sample.successes)}
                          </span>
                        </div>
                        <div className="min-w-0 whitespace-nowrap">
                          <span>Failures: </span>
                          <span className="font-medium text-foreground">
                            {formatCount(sample.failures)}
                          </span>
                        </div>
                        <div className="min-w-0 whitespace-nowrap">
                          <span className="font-medium text-foreground">&alpha;</span>
                          <span>: </span>
                          <span className="font-medium text-foreground">
                            {formatCount(sample.alpha)}
                          </span>
                        </div>
                        <div className="min-w-0 whitespace-nowrap">
                          <span className="font-medium text-foreground">&beta;</span>
                          <span>: </span>
                          <span className="font-medium text-foreground">
                            {formatCount(sample.beta)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            How to read this chart
          </h3>
          <p>
            All three curves are centered near the same observed conversion rate. The
            difference is width. With N = 100, the posterior is still broad. By N =
            2,000, the curve has squeezed tightly around 5%, which means the data is
            much more informative about the underlying rate.
          </p>
          <p>
            This is the core posterior update in Bayesian conversion modeling. Once
            you understand how observed successes and failures become α and β, the
            rest of Bayesian A/B testing becomes much more mechanical.
          </p>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 3
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Comparing two posteriors
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              An A/B test gives each variant its own stream of data, so each
              variant gets its own posterior. By the time you read results, you
              have two Beta distributions sitting side by side. The question is
              no longer what the rate is — it is which variant is actually better.
            </p>
            <p>
              The Bayesian answer is a direct probability. For every possible
              value the variant&apos;s rate might take, you can ask how much of the
              control&apos;s posterior falls below that value. Integrating across the
              full range gives you the probability that the variant&apos;s true rate
              exceeds the control&apos;s:
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mi>P</mi>
                  <mo>(</mo>
                  <msub>
                    <mi>&#x3B8;</mi>
                    <mi>B</mi>
                  </msub>
                  <mo>&gt;</mo>
                  <msub>
                    <mi>&#x3B8;</mi>
                    <mi>A</mi>
                  </msub>
                  <mo>)</mo>
                  <mo>=</mo>
                  <msubsup>
                    <mo>&#x222B;</mo>
                    <mn>0</mn>
                    <mn>1</mn>
                  </msubsup>
                  <msub>
                    <mi>f</mi>
                    <mi>B</mi>
                  </msub>
                  <mo>(</mo>
                  <mi>x</mi>
                  <mo>)</mo>
                  <mspace width="0.3em" />
                  <msub>
                    <mi>F</mi>
                    <mi>A</mi>
                  </msub>
                  <mo>(</mo>
                  <mi>x</mi>
                  <mo>)</mo>
                  <mspace width="0.3em" />
                  <mi>d</mi>
                  <mi>x</mi>
                </mrow>
              </math>
            </MathBlock>
            <p>
              Here <InlineMath>f<sub>B</sub></InlineMath> is the density of
              the variant&apos;s posterior and{" "}
              <InlineMath>F<sub>A</sub></InlineMath> is the cumulative
              distribution of the control&apos;s posterior. The result is a
              single number between 0 and 1 that directly answers the decision
              question.
            </p>
            <p>
              Computing that integral analytically requires the incomplete Beta
              function, which has no closed form for arbitrary parameters.
              Instead, both posteriors are evaluated on a fine grid of points
              spanning their combined range. Stepping left to right across that
              grid, two running totals are maintained simultaneously:
            </p>
            <MathBlock>
              <math display="block">
                <mtable columnalign="left" rowspacing="0.6em">
                  <mtr>
                    <mtd>
                      <msub><mi>F</mi><mi>A</mi></msub>
                      <mo>(</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo>
                      <mo>+=</mo>
                      <msub><mi>f</mi><mi>A</mi></msub>
                      <mo>(</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo>
                      <mo>&#x00B7;</mo>
                      <mi>&#x394;x</mi>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <mi>P</mi>
                      <mo>+=</mo>
                      <msub><mi>f</mi><mi>B</mi></msub>
                      <mo>(</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo>
                      <mo>&#x00B7;</mo>
                      <msub><mi>F</mi><mi>A</mi></msub>
                      <mo>(</mo><msub><mi>x</mi><mi>i</mi></msub><mo>)</mo>
                      <mo>&#x00B7;</mo>
                      <mi>&#x394;x</mi>
                    </mtd>
                  </mtr>
                </mtable>
              </math>
            </MathBlock>
            <p>
              The first line builds up{" "}
              <InlineMath>F<sub>A</sub></InlineMath> incrementally — at each
              step it is the approximate probability that the control rate
              falls below <InlineMath>x<sub>i</sub></InlineMath>. The second
              line weights the variant density at that point by how much of the
              control&apos;s distribution lies below it and accumulates the
              result. After stepping through the full grid, the accumulated{" "}
              <InlineMath>P</InlineMath> is the left Riemann sum approximation
              of the integral above. Both posteriors are smooth and
              well-concentrated, so the approximation converges quickly.
            </p>
          </div>
        </section>

        <section className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Control vs. variant posteriors</CardTitle>
              <CardDescription>
                Each curve is an independent Beta posterior built from the
                conversion rate and sample size you set on the right.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={SECTION_THREE_CHART_CONFIG}>
                <ComposedChart data={sectionThree.points}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="probability"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    minTickGap={24}
                  />
                  <YAxis
                    hide
                    domain={[0, Math.max(1, sectionThree.maxDensity * 1.1)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="control"
                    fill="var(--color-controlFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="variant"
                    fill="var(--color-variantFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    stroke="var(--color-control)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="variant"
                    stroke="var(--color-variant)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experiment controls</CardTitle>
              <CardDescription>
                Adjust the rates and sample size to see how the posteriors
                shift and P(B &gt; A) responds.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pb-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ab-control-rate">Control (A) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {abControlRate}%
                  </span>
                </div>
                <Slider
                  id="ab-control-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={abControlRate}
                  onValueChange={setAbControlRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ab-variant-rate">Variant (B) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {abVariantRate}%
                  </span>
                </div>
                <Slider
                  id="ab-variant-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={abVariantRate}
                  onValueChange={setAbVariantRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="ab-n">Sample size (N per variant)</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatCount(abN)}
                  </span>
                </div>
                <Slider
                  id="ab-n"
                  min={50}
                  max={5000}
                  step={50}
                  value={abN}
                  onValueChange={setAbN}
                />
                <p className="text-xs text-muted-foreground">
                  Larger N narrows both posteriors and sharpens the result
                  toward 0 or 1.
                </p>
              </div>

              <div className="rounded-md border border-border/70 bg-muted/30 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">P(B &gt; A)</p>
                  <span className="text-2xl font-semibold tabular-nums text-foreground">
                    {(sectionThree.probBBeatsA * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {sectionThree.probBBeatsA >= 0.95
                    ? "Strong evidence the variant outperforms control. Posteriors barely overlap."
                    : sectionThree.probBBeatsA >= 0.8
                      ? "Moderate evidence favoring the variant. Some overlap remains."
                      : sectionThree.probBBeatsA >= 0.5
                        ? "Weak evidence favoring the variant. The curves overlap substantially."
                        : sectionThree.probBBeatsA >= 0.2
                          ? "Evidence favors the control. The variant sits mostly below it."
                          : "Strong evidence the control outperforms the variant."}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            What the overlap is telling you
          </h3>
          <p>
            The region where the two curves cross is the zone of uncertainty.
            Both rates are plausible there given the data. When the curves are
            far apart, P(B &gt; A) is close to 0 or 1 and the decision is
            clear. When they nearly coincide, P(B &gt; A) drifts toward 50%,
            which does not mean the test is broken — it means the data cannot
            yet distinguish the two variants.
          </p>
          <p>
            Try pulling the control and variant rates close together and watch
            the posteriors merge. Then increase N and watch the curves narrow
            until they separate again. The same 2-point lift at N = 5,000 will
            produce a far more decisive result than at N = 100, because more
            data compresses both posteriors without moving their centers.
          </p>
          <p>
            This is the core advantage of the Bayesian framing. Instead of a
            binary reject-or-not decision, you get a continuous probability
            that can be monitored, communicated, and acted on as evidence
            accumulates.
          </p>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 4
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Expected loss
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              P(B &gt; A) tells you the direction, but not whether acting on it
              is wise. A 90% probability sounds decisive, but if B is only
              fractionally better, the cost of being wrong and the cost of
              being right are nearly the same. The question that actually drives
              the decision is: how much conversion rate do I sacrifice on
              average if I choose wrong?
            </p>
            <p>
              That quantity is called expected loss. There are two versions —
              one for each possible decision:
            </p>
            <MathBlock>
              <math display="block">
                <mtable columnalign="left" rowspacing="0.7em">
                  <mtr>
                    <mtd>
                      <msub><mi>Loss</mi><mi>B</mi></msub>
                      <mo>=</mo>
                      <mi>E</mi>
                      <mo>[</mo>
                      <mo>max</mo>
                      <mo>(</mo>
                      <msub><mi>&#x3B8;</mi><mi>A</mi></msub>
                      <mo>&#x2212;</mo>
                      <msub><mi>&#x3B8;</mi><mi>B</mi></msub>
                      <mo>,</mo>
                      <mn>0</mn>
                      <mo>)</mo>
                      <mo>]</mo>
                    </mtd>
                  </mtr>
                  <mtr>
                    <mtd>
                      <msub><mi>Loss</mi><mi>A</mi></msub>
                      <mo>=</mo>
                      <mi>E</mi>
                      <mo>[</mo>
                      <mo>max</mo>
                      <mo>(</mo>
                      <msub><mi>&#x3B8;</mi><mi>B</mi></msub>
                      <mo>&#x2212;</mo>
                      <msub><mi>&#x3B8;</mi><mi>A</mi></msub>
                      <mo>,</mo>
                      <mn>0</mn>
                      <mo>)</mo>
                      <mo>]</mo>
                    </mtd>
                  </mtr>
                </mtable>
              </math>
            </MathBlock>
            <p>
              <InlineMath>Loss<sub>B</sub></InlineMath> is the average
              conversion rate you give up by shipping B if A was secretly
              better. The <InlineMath>max(..., 0)</InlineMath> means you only
              count cases where A genuinely beats B — when B is better, the
              loss is zero. <InlineMath>Loss<sub>A</sub></InlineMath> is the
              symmetric regret of holding back B when it was the stronger
              variant.
            </p>
            <p>
              The rule is simple: ship B when{" "}
              <InlineMath>Loss<sub>B</sub></InlineMath> &lt;{" "}
              <InlineMath>Loss<sub>A</sub></InlineMath>. Equivalently, ship
              whichever variant has the lower cost of being wrong about it.
              Both losses are computed the same way as P(B &gt; A) — a single
              left-to-right pass over a fine grid, accumulating a weighted
              running CDF for each posterior.
            </p>
          </div>
        </section>

        <section className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Loss vs. the alternative</CardTitle>
              <CardDescription>
                The overlap between the curves is the source of both losses.
                The wider the overlap, the more you risk by deciding too early.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={SECTION_THREE_CHART_CONFIG}>
                <ComposedChart data={sectionFour.points}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="probability"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    minTickGap={24}
                  />
                  <YAxis
                    hide
                    domain={[0, Math.max(1, sectionFour.maxDensity * 1.1)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="control"
                    fill="var(--color-controlFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="variant"
                    fill="var(--color-variantFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    stroke="var(--color-control)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="variant"
                    stroke="var(--color-variant)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loss calculator</CardTitle>
              <CardDescription>
                Adjust the rates and sample size to see how expected loss
                shifts with the evidence.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pb-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s4-control-rate">Control (A) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {s4ControlRate}%
                  </span>
                </div>
                <Slider
                  id="s4-control-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={s4ControlRate}
                  onValueChange={setS4ControlRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s4-variant-rate">Variant (B) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {s4VariantRate}%
                  </span>
                </div>
                <Slider
                  id="s4-variant-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={s4VariantRate}
                  onValueChange={setS4VariantRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s4-n">Sample size (N per variant)</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatCount(s4N)}
                  </span>
                </div>
                <Slider
                  id="s4-n"
                  min={50}
                  max={5000}
                  step={50}
                  value={s4N}
                  onValueChange={setS4N}
                />
              </div>

              <div className="rounded-md border border-border/70 bg-muted/30 p-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">
                      Loss<sub>B</sub> (ship B, A was better)
                    </span>
                    <span className="tabular-nums font-medium text-foreground">
                      {(sectionFour.lossChooseB * 100).toFixed(3)} pp
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground">
                      Loss<sub>A</sub> (hold A, B was better)
                    </span>
                    <span className="tabular-nums font-medium text-foreground">
                      {(sectionFour.lossChooseA * 100).toFixed(3)} pp
                    </span>
                  </div>
                </div>
                <div className="mt-3 border-t border-border/60 pt-3">
                  <p className="font-medium text-foreground">
                    {sectionFour.lossChooseB < sectionFour.lossChooseA
                      ? "Ship variant B"
                      : "Stay with control A"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sectionFour.lossChooseB < sectionFour.lossChooseA
                      ? `Shipping B risks ${(sectionFour.lossChooseB * 100).toFixed(3)} pp. Holding risks ${(sectionFour.lossChooseA * 100).toFixed(3)} pp.`
                      : `Holding risks ${(sectionFour.lossChooseA * 100).toFixed(3)} pp. Shipping B risks ${(sectionFour.lossChooseB * 100).toFixed(3)} pp.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            Why this beats a fixed threshold
          </h3>
          <p>
            Try setting both rates to the same value and watch what happens.
            Even at 95% P(B &gt; A), if the actual difference is near zero,
            both losses collapse to nearly zero and the recommendation becomes
            arbitrary — which is the correct answer. The data says B is
            probably better, but not by enough to matter.
          </p>
          <p>
            Increase N with a real gap between the rates and the losing loss
            grows while the winning loss approaches zero. That asymmetry is
            the signal. When one loss is an order of magnitude smaller than
            the other, the decision is clear regardless of any probability
            threshold you might have set in advance.
          </p>
          <p>
            In practice, teams often add a minimum detectable effect to the
            loss formula — a floor below which a lift is not worth shipping
            given the cost of a release. That extension follows naturally from
            this framework, replacing the &gt; 0 in the max with &gt; MDE.
            The math is identical; only the breakeven point shifts.
          </p>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 5
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Should you keep running?
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Expected loss answers whether to act on the data you have. A
              different question is whether collecting more data is worth it.
              If Loss<sub>B</sub> is already near zero, running another week
              changes almost nothing — the decision is made. If both losses
              are still high and close together, more data has real value
              because it might separate them.
            </p>
            <p>
              The simplest way to see this is to project both losses forward.
              Assuming the observed rates stay constant, you can compute what
              the posterior — and therefore the expected loss — would look
              like at any future N. The resulting curves show you how quickly
              each loss is converging and where the decision becomes stable.
            </p>
            <p>
              Both losses shrink as N grows because larger samples produce
              narrower posteriors. But they do not shrink at the same rate.
              When one variant is genuinely better, its loss converges to zero
              much faster than the other. The gap between the two curves is
              the value of additional data — wide gap means collecting more
              helps, near-zero gap means you are done regardless of N.
            </p>
          </div>
        </section>

        <section className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Expected loss over sample size</CardTitle>
              <CardDescription>
                Both curves start at the current N and project forward. Where
                one line drops to near zero while the other stays high, the
                decision is settled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <ChartContainer config={SECTION_FIVE_CHART_CONFIG}>
                <ComposedChart data={sectionFive}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="n"
                    tickFormatter={(value: number) => formatCount(value)}
                    minTickGap={40}
                  />
                  <YAxis
                    width={48}
                    tickFormatter={(value: number) => value.toFixed(2)}
                  />
                  <Line
                    type="monotone"
                    dataKey="lossChooseA"
                    stroke="var(--color-lossChooseA)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="lossChooseB"
                    stroke="var(--color-lossChooseB)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded-full bg-[rgb(99,179,237)]" />
                  Hold A — cost of withholding B
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-0.5 w-5 rounded-full bg-[rgb(252,129,74)]" />
                  Ship B — cost of shipping prematurely
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projection controls</CardTitle>
              <CardDescription>
                Set the current state of your test. The chart projects both
                losses from N now to 5× N.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pb-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s5-control-rate">Control (A) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {s5ControlRate}%
                  </span>
                </div>
                <Slider
                  id="s5-control-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={s5ControlRate}
                  onValueChange={setS5ControlRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s5-variant-rate">Variant (B) rate</Label>
                  <span className="text-sm text-muted-foreground">
                    {s5VariantRate}%
                  </span>
                </div>
                <Slider
                  id="s5-variant-rate"
                  min={1}
                  max={20}
                  step={1}
                  value={s5VariantRate}
                  onValueChange={setS5VariantRate}
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="s5-n">Current N per variant</Label>
                  <span className="text-sm text-muted-foreground">
                    {formatCount(s5N)}
                  </span>
                </div>
                <Slider
                  id="s5-n"
                  min={50}
                  max={2000}
                  step={50}
                  value={s5N}
                  onValueChange={setS5N}
                />
                <p className="text-xs text-muted-foreground">
                  The leftmost point on the chart is the current expected
                  loss. The curve shows where each loss will be at 5× N.
                </p>
              </div>

              <div className="rounded-md border border-border/70 bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground">Current losses</p>
                <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-baseline justify-between gap-2">
                    <span>Hold A now</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {sectionFive[0]?.lossChooseA.toFixed(3)} pp
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span>Ship B now</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {sectionFive[0]?.lossChooseB.toFixed(3)} pp
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 pt-1">
                    <span>At 5× N</span>
                    <span className="tabular-nums font-medium text-foreground">
                      {sectionFive[sectionFive.length - 1]?.lossChooseB.toFixed(3)} pp (ship B)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            Reading the projection
          </h3>
          <p>
            Set both rates to the same value and the two curves collapse onto
            each other and both flatten near zero — there is no lift to find,
            so more data adds no value. Set a meaningful gap between the rates
            and one curve drops sharply while the other stays elevated. The
            x-value where the lower curve touches your loss threshold is the
            sample size you need.
          </p>
          <p>
            This is not a stopping rule in the frequentist sense. You are not
            controlling a false positive rate. You are asking a direct
            business question: at what N does the expected regret of acting
            become acceptable? The answer changes with the observed rates, so
            re-running this projection as data accumulates is the natural
            workflow.
          </p>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Protecting against noise
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Comparing Loss<sub>B</sub> to Loss<sub>A</sub> tells you the
              direction. It does not protect against acting too early. In a
              noisy test, Loss<sub>B</sub> can be the smaller number on a
              small sample and then reverse a week later — because both
              posteriors are still wide and the comparison is fragile. The
              fix is to add a pre-committed absolute threshold.
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <mo>Ship B when </mo>
                  <msub><mi>Loss</mi><mi>B</mi></msub>
                  <mo>=</mo>
                  <mi>E</mi>
                  <mo>[</mo>
                  <mo>max</mo>
                  <mo>(</mo>
                  <msub><mi>&#x3B8;</mi><mi>A</mi></msub>
                  <mo>&#x2212;</mo>
                  <msub><mi>&#x3B8;</mi><mi>B</mi></msub>
                  <mo>,</mo>
                  <mn>0</mn>
                  <mo>)</mo>
                  <mo>]</mo>
                  <mo>&lt;</mo>
                  <mi>&#x3B5;</mi>
                </mrow>
              </math>
            </MathBlock>
            <p>
              Choose <InlineMath>&#x3B5;</InlineMath> before the test
              launches — not after you see the data. A principled starting
              point is to set it equal to the minimum lift your business
              would actually act on. If a 0.5 percentage-point improvement
              in conversion rate is the smallest effect worth shipping, set{" "}
              <InlineMath>&#x3B5; = 0.005</InlineMath>. This is your
              minimum detectable effect expressed as an acceptable level of
              regret.
            </p>
            <p>
              The threshold does something that the comparison alone cannot:
              it requires the magnitude of the loss to fall below a
              meaningful level, not just below the other loss. When
              posteriors are wide, expected loss stays elevated even when one
              variant is ahead in raw conversions — because the integral
              weights the apparent advantage by how probable it is. Early
              in a test, that probability is low, so the loss is high. The
              threshold <InlineMath>&#x3B5;</InlineMath> forces the data to
              be informative enough to compress the loss before you act.
            </p>
            <p>
              This connects directly to the section 5 loss curve. The sample
              size you need is the point where the projected
              Loss<sub>B</sub> curve first drops below{" "}
              <InlineMath>&#x3B5;</InlineMath>:
            </p>
            <MathBlock>
              <math display="block">
                <mrow>
                  <msub><mi>N</mi><mi>min</mi></msub>
                  <mo>=</mo>
                  <mo>min</mo>
                  <mo>{`{`}</mo>
                  <mi>N</mi>
                  <mo>:</mo>
                  <msub><mi>Loss</mi><mi>B</mi></msub>
                  <mo>(</mo>
                  <mi>N</mi>
                  <mo>)</mo>
                  <mo>&lt;</mo>
                  <mi>&#x3B5;</mi>
                  <mo>{`}`}</mo>
                </mrow>
              </math>
            </MathBlock>
            <p>
              The full stopping rule is then two conditions, both of which
              must hold simultaneously:
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                <span className="font-medium text-foreground">
                  Loss<sub>B</sub> &lt; &#x3B5;
                </span>
                {" "}— the expected regret of shipping is below your
                threshold
              </li>
              <li>
                <span className="font-medium text-foreground">
                  N &#x2265; N<sub>min</sub>
                </span>
                {" "}— you have collected enough data for the loss projection
                to be credible at the observed rates
              </li>
            </ol>
            <p>
              The two-condition rule would have blocked the premature calls
              in the walkthrough below. In weeks 1 and 2, Loss<sub>B</sub>{" "}
              was lower than Loss<sub>A</sub> — but not below any reasonable{" "}
              <InlineMath>&#x3B5;</InlineMath>. The first condition fails,
              and the test runs. By week 6, both conditions are satisfied
              and the recommendation is credible.
            </p>
          </div>
        </section>

        <section className="mt-16 max-w-3xl space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Section 6
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              A test, week by week
            </h2>
          </div>

          <div className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              The scenario below is a live test. You do not know the true
              rates. New users arrive each week and the posteriors update.
              Step through the weeks and watch the recommendation — it will
              not go in a straight line.
            </p>
          </div>
        </section>

        <section className="mt-6">
          <Card>
            <CardHeader>
              <CardContent className="px-0 pb-0 pt-2">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="s6-week" className="text-base font-semibold">
                      {EXAMPLE_NARRATIVES[s6Week - 1].heading}
                    </Label>
                    <span className="text-sm text-muted-foreground">
                      Week {s6Week} of 6
                    </span>
                  </div>
                  <Slider
                    id="s6-week"
                    min={1}
                    max={6}
                    step={1}
                    value={s6Week}
                    onValueChange={setS6Week}
                  />
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    {WORKED_EXAMPLE_WEEKS.map((w) => (
                      <span key={w.week}>Wk {w.week}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </CardHeader>

            <CardContent className="grid gap-6 pb-6 md:grid-cols-[minmax(0,1fr)_280px]">
              <ChartContainer config={SECTION_THREE_CHART_CONFIG}>
                <ComposedChart data={sectionSix.points}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="probability"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                    minTickGap={24}
                  />
                  <YAxis
                    hide
                    domain={[0, Math.max(1, sectionSix.maxDensity * 1.1)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="control"
                    fill="var(--color-controlFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Area
                    type="monotone"
                    dataKey="variant"
                    fill="var(--color-variantFill)"
                    fillOpacity={1}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="control"
                    stroke="var(--color-control)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="variant"
                    stroke="var(--color-variant)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>

              <div className="flex flex-col gap-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  {EXAMPLE_NARRATIVES[s6Week - 1].body}
                </p>

                <div className="mt-auto space-y-2 rounded-md border border-border/70 bg-muted/30 p-3 text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="text-muted-foreground">N per variant</div>
                    <div className="text-right tabular-nums font-medium text-foreground">
                      {formatCount(sectionSix.data.nPerVariant)}
                    </div>
                    <div className="text-muted-foreground">P(B &gt; A)</div>
                    <div className="text-right tabular-nums font-medium text-foreground">
                      {(sectionSix.probBBeatsA * 100).toFixed(1)}%
                    </div>
                    <div className="text-muted-foreground">Loss<sub>A</sub></div>
                    <div className="text-right tabular-nums font-medium text-foreground">
                      {(sectionSix.lossChooseA * 100).toFixed(3)} pp
                    </div>
                    <div className="text-muted-foreground">Loss<sub>B</sub></div>
                    <div className="text-right tabular-nums font-medium text-foreground">
                      {(sectionSix.lossChooseB * 100).toFixed(3)} pp
                    </div>
                  </div>
                  {s6Week === 6 && (
                    <div className="border-t border-border/60 pt-2 pb-1 space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        True rates (revealed)
                      </p>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-muted-foreground">Control (A)</span>
                        <span className="tabular-nums font-medium text-foreground">5.0%</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-muted-foreground">Variant (B)</span>
                        <span className="tabular-nums font-medium text-foreground">6.5%</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border/60 pt-2">
                    <span className="font-medium text-foreground">
                      {sectionSix.lossChooseB < sectionSix.lossChooseA
                        ? "Ship variant B"
                        : "Hold with control A"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-10 max-w-3xl space-y-4 text-sm leading-7 text-muted-foreground">
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            What this walkthrough shows
          </h3>
          <p>
            The recommendation flipped twice. B looked like the clear winner
            in weeks 1 and 2, then A pulled ahead for weeks 3 and 4, then B
            reclaimed the lead in weeks 5 and 6. The true rates — 5% for the
            control and 6.5% for the variant — were never visible during the
            test, only revealed at the end. The early lead for B was
            variance. A had two strong weeks. Then the true signal reasserted.
          </p>
          <p>
            Notice that in weeks 1 and 2, both losses were high in absolute
            terms even though Loss<sub>B</sub> was the smaller one. That is
            the signature of a wide posterior — the comparison points in a
            direction but the magnitude says the data is thin. A pre-set
            threshold <InlineMath>&#x3B5;</InlineMath> would have held the
            test through those weeks regardless of which loss was lower.
          </p>
          <p>
            This is the full loop. Prior, posterior update, P(B &gt; A) for
            direction, expected loss for stakes, the threshold and N<sub>min</sub>{" "}
            for noise protection, and the loss projection for deciding
            whether to wait. Each piece built directly on the Beta
            distribution from section 1.
          </p>
        </section>
      </article>
    </div>
  )
}
