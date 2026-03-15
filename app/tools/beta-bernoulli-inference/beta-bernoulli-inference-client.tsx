"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
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
import {
  betaEqualTailInterval,
  betaMean,
  betaMode,
  betaProbabilityBetween,
  betaPdf,
  clamp,
  updateBetaPosterior,
} from "@/shared/lib/bayes"

type HypothesisMode = "around" | "above" | "below"

type ToolInputs = {
  trials: string
  successes: string
  priorAlpha: string
  priorBeta: string
  queryMode: HypothesisMode
  targetRate: string
  tolerancePercent: string
}

type Query =
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

type ComputedPosteriorSummary = {
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

type ChartPoint = {
  probabilityPercent: number
  priorDensity: number
  posteriorDensity: number
  shadedDensity: number | null
}

const DEFAULT_INPUTS: ToolInputs = {
  trials: "20",
  successes: "11",
  priorAlpha: "1",
  priorBeta: "1",
  queryMode: "around",
  targetRate: "50%",
  tolerancePercent: "5",
}

const EXAMPLES: Array<{
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

const CHART_CONFIG = {
  priorDensity: {
    label: "Prior",
    theme: {
      light: "oklch(0.58 0.04 215)",
      dark: "oklch(0.72 0.03 215)",
      terminal: "rgb(148 163 184)",
    },
  },
  posteriorDensity: {
    label: "Posterior",
    theme: {
      light: "oklch(0.56 0.18 251)",
      dark: "oklch(0.74 0.12 251)",
      terminal: "rgb(166 206 255)",
    },
  },
  shadedDensity: {
    label: "Hypothesis region",
    theme: {
      light: "oklch(0.8 0.08 45 / 0.48)",
      dark: "oklch(0.45 0.09 45 / 0.5)",
      terminal: "rgba(252 129 74 / 0.3)",
    },
  },
} satisfies ChartConfig

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

function parsePositiveNumber(value: string): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseRateToken(rawValue: string): number | null {
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

function formatPercent(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`
}

function formatRateRange(lower: number, upper: number): string {
  return `${formatPercent(lower, 1)} to ${formatPercent(upper, 1)}`
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

function getInputsFromSearchParams(searchParams: URLSearchParams): ToolInputs {
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

function createSearchParamsFromInputs(inputs: ToolInputs): URLSearchParams {
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

function parseQuery(
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

function computeQueryProbability(
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

function describeQuery(query: Query): string {
  if (query.mode === "around") {
    return `around ${formatPercent(query.targetRate, 1)} (${formatRateRange(query.lower, query.upper)})`
  }

  return `${query.mode === "above" ? "above" : "below"} ${formatPercent(query.targetRate, 1)}`
}

function createExplanation(summary: ComputedPosteriorSummary): string {
  if (summary.query.mode === "around") {
    return `The posterior assigns ${formatPercent(summary.queryProbability)} probability to the event rate landing between ${formatRateRange(summary.query.lower, summary.query.upper)}.`
  }

  return `The posterior assigns ${formatPercent(summary.queryProbability)} probability to the event rate being ${summary.query.mode} ${formatPercent(summary.query.targetRate, 1)}.`
}

function createChartData(summary: ComputedPosteriorSummary): ChartPoint[] {
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

function getMetricTone(probability: number): string {
  if (probability >= 0.8) {
    return "The posterior leans strongly toward this hypothesis."
  }

  if (probability >= 0.6) {
    return "The posterior favors this hypothesis, but uncertainty remains material."
  }

  if (probability >= 0.4) {
    return "The posterior is still fairly split across plausible rates."
  }

  if (probability >= 0.2) {
    return "The posterior currently leans against this hypothesis."
  }

  return "Only a small portion of the posterior mass supports this hypothesis."
}

export function BetaBernoulliInferenceClient() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const routePath = pathname ?? "/tools/beta-bernoulli-inference"

  const [inputs, setInputs] = React.useState<ToolInputs>(DEFAULT_INPUTS)

  React.useEffect(() => {
    const nextInputs = searchParams
      ? getInputsFromSearchParams(searchParams)
      : DEFAULT_INPUTS

    setInputs((current) => {
      const currentSerialized = createSearchParamsFromInputs(current).toString()
      const nextSerialized = createSearchParamsFromInputs(nextInputs).toString()

      if (currentSerialized === nextSerialized) {
        return current
      }

      return nextInputs
    })
  }, [searchParams])

  const validation = React.useMemo(() => {
    const trials = parseWholeNumber(inputs.trials)
    if (trials === null) {
      return { error: "Trials must be a non-negative whole number." }
    }

    const successes = parseWholeNumber(inputs.successes)
    if (successes === null) {
      return { error: "Successes must be a non-negative whole number." }
    }

    if (successes > trials) {
      return { error: "Successes cannot exceed trials." }
    }

    const priorAlpha = parsePositiveNumber(inputs.priorAlpha)
    if (priorAlpha === null) {
      return { error: "Prior alpha must be greater than 0." }
    }

    const priorBeta = parsePositiveNumber(inputs.priorBeta)
    if (priorBeta === null) {
      return { error: "Prior beta must be greater than 0." }
    }

    const parsedQuery = parseQuery(
      inputs.queryMode,
      inputs.targetRate,
      inputs.tolerancePercent
    )

    if (!parsedQuery.query) {
      return { error: parsedQuery.error ?? "Query is invalid." }
    }

    return {
      error: null,
      value: {
        trials,
        successes,
        priorAlpha,
        priorBeta,
        query: parsedQuery.query,
      },
    }
  }, [inputs])

  const summary = React.useMemo<ComputedPosteriorSummary | null>(() => {
    if (validation.error || !validation.value) {
      return null
    }

    const { trials, successes, priorAlpha, priorBeta, query } = validation.value
    const failures = trials - successes
    const posterior = updateBetaPosterior({
      alpha: priorAlpha,
      beta: priorBeta,
      trials,
      successes,
    })
    const queryProbability = computeQueryProbability(
      posterior.alpha,
      posterior.beta,
      query
    )

    const result: ComputedPosteriorSummary = {
      trials,
      successes,
      failures,
      priorAlpha,
      priorBeta,
      posteriorAlpha: posterior.alpha,
      posteriorBeta: posterior.beta,
      posteriorMean: betaMean(posterior.alpha, posterior.beta),
      posteriorMode: betaMode(posterior.alpha, posterior.beta),
      credibleInterval: betaEqualTailInterval(posterior.alpha, posterior.beta),
      query,
      queryProbability,
      explanation: "",
    }

    return {
      ...result,
      explanation: createExplanation(result),
    }
  }, [validation])

  const chartData = React.useMemo(() => (summary ? createChartData(summary) : []), [summary])

  const applyInputs = React.useCallback(
    (nextInputs: ToolInputs) => {
      setInputs(nextInputs)
      const nextSearch = createSearchParamsFromInputs(nextInputs).toString()
      router.replace(nextSearch ? `${routePath}?${nextSearch}` : routePath, {
        scroll: false,
      })
    },
    [routePath, router]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    applyInputs(inputs)
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Beta-Bernoulli Inference
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Start with a Beta prior, update it with Bernoulli observations, and
            inspect how the posterior mass shifts around a structured rate
            hypothesis.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inference Setup</CardTitle>
                <CardDescription>
                  Define the prior, the observed outcomes, and the hypothesis you
                  want the posterior to answer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-6" onSubmit={handleSubmit}>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="bernoulli-trials">Trials</Label>
                      <Input
                        id="bernoulli-trials"
                        inputMode="numeric"
                        value={inputs.trials}
                        onChange={(event) =>
                          setInputs((current) => ({
                            ...current,
                            trials: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bernoulli-successes">Successes</Label>
                      <Input
                        id="bernoulli-successes"
                        inputMode="numeric"
                        value={inputs.successes}
                        onChange={(event) =>
                          setInputs((current) => ({
                            ...current,
                            successes: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bernoulli-target-rate">Target rate</Label>
                      <Input
                        id="bernoulli-target-rate"
                        placeholder="0.6 or 60%"
                        value={inputs.targetRate}
                        onChange={(event) =>
                          setInputs((current) => ({
                            ...current,
                            targetRate: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bernoulli-alpha">Prior alpha</Label>
                      <Input
                        id="bernoulli-alpha"
                        inputMode="decimal"
                        value={inputs.priorAlpha}
                        onChange={(event) =>
                          setInputs((current) => ({
                            ...current,
                            priorAlpha: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bernoulli-beta">Prior beta</Label>
                      <Input
                        id="bernoulli-beta"
                        inputMode="decimal"
                        value={inputs.priorBeta}
                        onChange={(event) =>
                          setInputs((current) => ({
                            ...current,
                            priorBeta: event.target.value,
                          }))
                        }
                      />
                    </div>
                    {inputs.queryMode === "around" ? (
                      <div className="grid gap-2">
                        <Label htmlFor="bernoulli-tolerance">
                          Tolerance (%)
                        </Label>
                        <Input
                          id="bernoulli-tolerance"
                          inputMode="decimal"
                          value={inputs.tolerancePercent}
                          onChange={(event) =>
                            setInputs((current) => ({
                              ...current,
                              tolerancePercent: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <Label>Hypothesis</Label>
                    <div className="flex flex-wrap gap-2">
                      {([
                        { mode: "around", label: "Around rate" },
                        { mode: "above", label: "Above rate" },
                        { mode: "below", label: "Below rate" },
                      ] as const).map((option) => (
                        <Button
                          key={option.mode}
                          type="button"
                          variant={
                            inputs.queryMode === option.mode ? "default" : "outline"
                          }
                          onClick={() =>
                            setInputs((current) => ({
                              ...current,
                              queryMode: option.mode,
                            }))
                          }
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="submit">Apply setup</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyInputs(DEFAULT_INPUTS)}
                    >
                      Reset defaults
                    </Button>
                  </div>
                </form>

                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                  <p>
                    Use <code>around</code> for a rate band, or <code>above</code> /{" "}
                    <code>below</code> for posterior tail probability.
                  </p>
                  <p>
                    Target rate accepts either decimals like <code>0.6</code> or
                    percentages like <code>60%</code>.
                  </p>
                </div>

                {validation.error ? (
                  <p className="mt-3 text-sm text-destructive">{validation.error}</p>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Presets</CardTitle>
                <CardDescription>
                  Load common Beta-Bernoulli setups to compare how prior choice and
                  sample size change the posterior.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {EXAMPLES.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    className="rounded-2xl border border-border/70 p-4 text-left transition-colors hover:bg-muted/40"
                    onClick={() => applyInputs(example.inputs)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{example.label}</p>
                      <Badge variant="outline">{example.inputs.queryMode}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {example.description}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Posterior Summary</CardTitle>
                <CardDescription>
                  The posterior is the updated distribution over the underlying
                  Bernoulli success probability.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {summary ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Posterior mean
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatPercent(summary.posteriorMean)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Hypothesis probability
                        </p>
                        <p className="mt-2 text-2xl font-semibold">
                          {formatPercent(summary.queryProbability)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          95% credible interval
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {formatRateRange(
                            summary.credibleInterval.lower,
                            summary.credibleInterval.upper
                          )}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-border/70 p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          MAP estimate
                        </p>
                        <p className="mt-2 text-lg font-semibold">
                          {summary.posteriorMode === null
                            ? "Not defined"
                            : formatPercent(summary.posteriorMode)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          Query: {describeQuery(summary.query)}
                        </Badge>
                        <Badge variant="outline">
                          Failures: {formatCount(summary.failures)}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">
                        {summary.explanation}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getMetricTone(summary.queryProbability)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Prior: Beta({summary.priorAlpha.toFixed(2)},{" "}
                        {summary.priorBeta.toFixed(2)}). Posterior: Beta(
                        {summary.posteriorAlpha.toFixed(2)},{" "}
                        {summary.posteriorBeta.toFixed(2)}).
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter a valid setup to compute the posterior.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Beta Distribution Chart</CardTitle>
                <CardDescription>
                  The shaded area shows the part of the posterior that satisfies
                  the current hypothesis.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {summary ? (
                  <>
                    <ChartContainer config={CHART_CONFIG} preset="terminal">
                      <ComposedChart data={chartData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                          dataKey="probabilityPercent"
                          tickFormatter={(value: number) => `${value.toFixed(0)}%`}
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
                                typeof value === "number" ? value.toFixed(2) : value
                              }
                              labelFormatter={(label) =>
                                `Success probability ${Number(label).toFixed(1)}%`
                              }
                            />
                          )}
                        />
                        <Area
                          type="monotone"
                          dataKey="shadedDensity"
                          fill="var(--color-shadedDensity)"
                          stroke="none"
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="priorDensity"
                          stroke="var(--color-priorDensity)"
                          strokeDasharray="6 6"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="posteriorDensity"
                          stroke="var(--color-posteriorDensity)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <ReferenceLine
                          x={summary.posteriorMean * 100}
                          stroke="var(--color-posteriorDensity)"
                          strokeDasharray="4 4"
                        />
                        <ReferenceLine
                          x={summary.query.targetRate * 100}
                          stroke="var(--color-shadedDensity)"
                          strokeDasharray="2 6"
                        />
                      </ComposedChart>
                    </ChartContainer>

                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <p>
                        The dashed gray curve is the prior, and the solid blue curve
                        is the posterior after observing the data.
                      </p>
                      <p>
                        The blue reference line marks the posterior mean. The orange
                        reference line marks the hypothesis target rate.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The chart appears once the setup is valid.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}
