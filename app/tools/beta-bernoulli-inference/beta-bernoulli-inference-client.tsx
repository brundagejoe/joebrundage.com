"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Caption, ProbabilityStrip, Row, Section } from "@/shared/ui/plate"

import { PosteriorFigure, ThresholdSweepFigure } from "./figures"
import {
  buildReport,
  createSearchParamsFromInputs,
  DEFAULT_INPUTS,
  describeQuery,
  EXAMPLES,
  formatCount,
  formatPercent,
  formatRateRange,
  getInputsFromSearchParams,
  parsePositiveNumber,
  parseQuery,
  parseWholeNumber,
  type HypothesisMode,
  type ToolInputs,
} from "./model"

const MODES: { mode: HypothesisMode; label: string }[] = [
  { mode: "around", label: "Around" },
  { mode: "above", label: "Above" },
  { mode: "below", label: "Below" },
]

function Field({
  id,
  label,
  suffix,
  value,
  onChange,
}: {
  id: string
  label: string
  suffix?: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label
      htmlFor={id}
      className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-current/20 py-1.5 transition-colors has-[:focus]:border-current/70"
    >
      <span className="plate-label text-[0.7rem] font-medium uppercase tracking-[0.08em] opacity-60">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="plate-data w-[5rem] bg-transparent text-right text-[0.95rem] outline-none"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? (
          <span className="w-2 text-[0.8rem] opacity-50">{suffix}</span>
        ) : (
          <span className="w-2" aria-hidden />
        )}
      </span>
    </label>
  )
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
      return currentSerialized === nextSerialized ? current : nextInputs
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

  const report = React.useMemo(() => {
    if (validation.error || !validation.value) {
      return null
    }
    const { trials, successes, priorAlpha, priorBeta, query } = validation.value
    return buildReport(trials, successes, priorAlpha, priorBeta, query)
  }, [validation])

  const setInput = (key: keyof ToolInputs) => (next: string) =>
    setInputs((current) => ({ ...current, [key]: next }))

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

  const observedRate =
    report && report.trials > 0 ? report.successes / report.trials : null
  const modeWord =
    report?.query.mode === "around"
      ? "within reach of"
      : (report?.query.mode ?? "above")

  return (
    <div className="plate min-h-screen bg-background pt-16">
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[15rem_minmax(0,1fr)]"
        >
          <div className="lg:sticky lg:top-24">
            <p className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
              The setup
            </p>

            <div className="mt-3 grid">
              <p className="plate-label mt-2 text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                What you saw
              </p>
              <Field
                id="bernoulli-trials"
                label="Trials"
                value={inputs.trials}
                onChange={setInput("trials")}
              />
              <Field
                id="bernoulli-successes"
                label="Successes"
                value={inputs.successes}
                onChange={setInput("successes")}
              />

              <p className="plate-label mt-6 text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                What you believed first
              </p>
              <Field
                id="bernoulli-alpha"
                label="Prior alpha"
                value={inputs.priorAlpha}
                onChange={setInput("priorAlpha")}
              />
              <Field
                id="bernoulli-beta"
                label="Prior beta"
                value={inputs.priorBeta}
                onChange={setInput("priorBeta")}
              />

              <p className="plate-label mt-6 text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                What you want to know
              </p>
              <div className="flex gap-4 border-b border-current/20 py-2">
                {MODES.map((option) => (
                  <button
                    key={option.mode}
                    type="button"
                    aria-pressed={inputs.queryMode === option.mode}
                    onClick={() =>
                      setInputs((current) => ({
                        ...current,
                        queryMode: option.mode,
                      }))
                    }
                    className={
                      "plate-label text-[0.7rem] font-medium uppercase tracking-[0.08em] transition-opacity " +
                      (inputs.queryMode === option.mode
                        ? "opacity-100 underline underline-offset-4"
                        : "opacity-45 hover:opacity-75")
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <Field
                id="bernoulli-target-rate"
                label="Rate"
                value={inputs.targetRate}
                onChange={setInput("targetRate")}
              />
              {inputs.queryMode === "around" ? (
                <Field
                  id="bernoulli-tolerance"
                  label="Give or take"
                  suffix="%"
                  value={inputs.tolerancePercent}
                  onChange={setInput("tolerancePercent")}
                />
              ) : null}
            </div>

            <button
              type="submit"
              className="plate-label mt-6 w-full border border-current/40 py-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] opacity-75 transition-opacity hover:opacity-100"
            >
              Recompute
            </button>

            {validation.error ? (
              <p className="mt-3 text-[0.84rem] text-destructive">
                {validation.error}
              </p>
            ) : null}

            <p className="plate-label mt-8 text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
              Or start from
            </p>
            <div className="mt-1">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => applyInputs(example.inputs)}
                  className="block w-full border-b border-current/15 py-2 text-left text-[0.86rem] opacity-70 transition-opacity hover:opacity-100"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <Row
              note={
                <>
                  Rates accept either form: <span className="italic">0.6</span>{" "}
                  or <span className="italic">60%</span>.
                </>
              }
            >
              <h1 className="text-[2.4rem] leading-tight">
                Beta-Bernoulli Inference
              </h1>
              <p className="mt-4 max-w-[38rem]">
                You have a run of yes-or-no outcomes and a belief about the rate
                behind them. Combining the two gives a distribution over that
                rate, not a single estimate — and from the distribution you can
                read off the answer to any question you care to ask of it.
              </p>
            </Row>

            {!report ? (
              <>
                <Section>No reading yet</Section>
                <Row>
                  <p className="mt-4 max-w-[38rem] opacity-70">
                    Fix the setup on the left and the posterior will appear
                    here.
                  </p>
                </Row>
              </>
            ) : (
              <>
                <Section>The reading</Section>
                <Row
                  note={
                    <>
                      The strip runs 0 to 100%. Its tick marks an even chance.
                    </>
                  }
                >
                  <p className="mt-4 flex max-w-[38rem] flex-wrap items-baseline gap-x-2 text-[1.5rem] leading-[1.45]">
                    <span>
                      The rate is {modeWord}{" "}
                      {formatPercent(report.query.targetRate, 1)} with
                      probability
                    </span>
                    <span className="plate-figures">
                      {formatPercent(report.queryProbability, 1)}
                    </span>
                    <ProbabilityStrip
                      probability={report.queryProbability}
                      threshold={0.5}
                    />
                  </p>
                  <p className="mt-3 max-w-[38rem] text-[1.5rem] leading-[1.45]">
                    Its most likely value is{" "}
                    <span className="plate-figures">
                      {formatPercent(report.posteriorMean, 1)}
                    </span>
                    , and the data are consistent with anything from{" "}
                    <span className="plate-figures">
                      {formatRateRange(
                        report.credibleInterval.lower,
                        report.credibleInterval.upper
                      )}
                    </span>
                    .
                  </p>
                  <p className="mt-5 max-w-[38rem] opacity-80">
                    That comes from{" "}
                    <span className="plate-figures">
                      {formatCount(report.successes)}
                    </span>{" "}
                    successes in{" "}
                    <span className="plate-figures">
                      {formatCount(report.trials)}
                    </span>{" "}
                    trials — an observed{" "}
                    <span className="plate-figures">
                      {observedRate === null
                        ? "n/a"
                        : formatPercent(observedRate, 1)}
                    </span>{" "}
                    — pulled toward the prior, which carries the weight of about{" "}
                    <span className="plate-figures">
                      {formatCount(report.priorWeight)}
                    </span>{" "}
                    earlier observations.
                  </p>
                </Row>

                <Section>
                  Figure 1 &nbsp;&middot;&nbsp; Before and after the data
                </Section>
                <Row
                  note={
                    <>
                      The shaded area is the hypothesis. Everything else on this
                      page is a summary of it.
                    </>
                  }
                >
                  <div className="mt-6">
                    <PosteriorFigure
                      points={report.chart}
                      query={report.query}
                      queryProbability={report.queryProbability}
                      posteriorMean={report.posteriorMean}
                      intervalLower={report.credibleInterval.lower}
                      intervalUpper={report.credibleInterval.upper}
                    />
                  </div>
                  <Caption>
                    The dashed curve is the prior, the solid one the posterior
                    after {formatCount(report.trials)} trials. The shaded region
                    is the part of the posterior that satisfies{" "}
                    {describeQuery(report.query)}, and its area is the{" "}
                    {formatPercent(report.queryProbability, 1)} quoted above.
                    The prior is drawn to its own height so its shape stays
                    legible; only the posterior is on the density scale.
                  </Caption>
                </Row>

                <Section>
                  Figure 2 &nbsp;&middot;&nbsp; How much the answer depends on
                  the line
                </Section>
                <Row
                  note={
                    <>
                      A steep curve at your target means the answer is sensitive
                      to where you drew the line. A flat one means it is not.
                    </>
                  }
                >
                  <div className="mt-6">
                    <ThresholdSweepFigure
                      points={report.sweep}
                      targetRate={report.query.targetRate}
                      probability={report.queryProbability}
                      mode={report.query.mode}
                    />
                  </div>
                  <Caption>
                    The same question asked at every possible target rate, with
                    yours marked. Reading across: the probability that the true
                    rate is {describeQuery(report.query)} is{" "}
                    {formatPercent(report.queryProbability, 1)}. The dotted
                    leaders run to the axis that decodes each coordinate. Move
                    the target and the answer slides along this curve.
                  </Caption>
                </Row>

                <Section>
                  Figure 3 &nbsp;&middot;&nbsp; What the data changed
                </Section>
                <Row
                  note={
                    <>
                      A Beta prior behaves like α&nbsp;&minus;&nbsp;1 successes
                      and β&nbsp;&minus;&nbsp;1 failures already on the books.
                    </>
                  }
                >
                  <table className="plate-data mt-6 w-full max-w-[34rem] text-[0.85rem]">
                    <thead>
                      <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                        <th className="py-1 text-left font-medium">Belief</th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Alpha
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Beta
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Mean
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          95% interval
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-1.5">Prior</td>
                        <td className="py-1.5 pl-5 text-right">
                          {report.priorAlpha.toFixed(2)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {report.priorBeta.toFixed(2)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {formatPercent(report.priorMean, 1)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {formatRateRange(
                            report.priorInterval.lower,
                            report.priorInterval.upper
                          )}
                        </td>
                      </tr>
                      <tr className="border-b border-current/25">
                        <td className="py-1.5">Posterior</td>
                        <td className="py-1.5 pl-5 text-right">
                          {report.posteriorAlpha.toFixed(2)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {report.posteriorBeta.toFixed(2)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {formatPercent(report.posteriorMean, 1)}
                        </td>
                        <td className="py-1.5 pl-5 text-right">
                          {formatRateRange(
                            report.credibleInterval.lower,
                            report.credibleInterval.upper
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 opacity-70" colSpan={3}>
                          Most likely single value (MAP)
                        </td>
                        <td className="py-1.5 pl-5 text-right" colSpan={2}>
                          {report.posteriorMode === null
                            ? "not defined"
                            : formatPercent(report.posteriorMode, 1)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <Caption>
                    {formatCount(report.successes)} successes and{" "}
                    {formatCount(report.failures)} failures moved the mean from{" "}
                    {formatPercent(report.priorMean, 1)} to{" "}
                    {formatPercent(report.posteriorMean, 1)} and narrowed the
                    interval from{" "}
                    {(
                      (report.priorInterval.upper -
                        report.priorInterval.lower) *
                      100
                    ).toFixed(1)}{" "}
                    points wide to{" "}
                    {(
                      (report.credibleInterval.upper -
                        report.credibleInterval.lower) *
                      100
                    ).toFixed(1)}
                    .
                  </Caption>
                </Row>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
