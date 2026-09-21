"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  LiftDistributionFigure,
  ProbabilityStaircase,
  ProbabilityStrip,
  RateDistributionFigure,
  RegretDecayFigure,
} from "./figures"
import {
  createSearchParamsFromInputs,
  FIXED_PRIOR_ALPHA,
  FIXED_PRIOR_BETA,
  formatCount,
  formatExpectedMissedConversions,
  formatPercent,
  formatPercentagePoints,
  formatRelativeLift,
  formatUnsignedPercentagePoints,
  getInitialInputs,
  getInitialResult,
  getInputsFromSearchParams,
  validateAndCalculate,
  type AnalysisResult,
  type Inputs,
} from "./model"

const VERDICT_HEADLINE: Record<AnalysisResult["decisionStatus"], string> = {
  "Ship Variant B": "Ship B.",
  "Keep Variant A": "Keep A.",
  "Continue test": "Keep the test running.",
  Inconclusive: "No call yet.",
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="plate-label mt-14 border-t border-current/20 pt-2 text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
      {children}
    </h2>
  )
}

function Row({
  children,
  note,
}: {
  children: React.ReactNode
  note?: React.ReactNode
}) {
  return (
    <div className="grid gap-x-8 gap-y-3 xl:grid-cols-[minmax(0,44rem)_12rem]">
      <div className="min-w-0">{children}</div>
      {note ? (
        <aside className="text-[0.84rem] leading-relaxed opacity-60 xl:pt-1">
          {note}
        </aside>
      ) : (
        <div aria-hidden />
      )}
    </div>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 max-w-[40rem] text-[0.9rem] leading-relaxed opacity-65">
      {children}
    </p>
  )
}

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
          className="plate-data w-[5.5rem] bg-transparent text-right text-[0.95rem] outline-none"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required
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

export default function BayesianAbTestPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [inputs, setInputs] = React.useState<Inputs>(getInitialInputs)
  const [hasInitializedFromUrl, setHasInitializedFromUrl] =
    React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<AnalysisResult>(getInitialResult)

  React.useEffect(() => {
    const nextInputs = searchParams
      ? getInputsFromSearchParams(searchParams)
      : getInitialInputs()
    const nextState = validateAndCalculate(nextInputs)

    setInputs(nextInputs)
    setError(nextState.error)

    if (nextState.result) {
      setResult(nextState.result)
    }

    setHasInitializedFromUrl(true)
  }, [searchParams])

  const setInput = (key: keyof Inputs) => (next: string) =>
    setInputs((previous) => ({ ...previous, [key]: next }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextState = validateAndCalculate(inputs)

    setError(nextState.error)

    if (!nextState.result) {
      return
    }

    setResult(nextState.result)
    router.replace(
      `${pathname}?${createSearchParamsFromInputs(inputs).toString()}`,
      { scroll: false }
    )
  }

  const { meaningfulLift, decisionThreshold } = result
  const meaningfulLabel = formatPercent(meaningfulLift, 0)
  const lift = (value: number | null) =>
    formatRelativeLift(value, 1).replace("-", "\u2212")

  const isThreshold = (cut: number) => Math.abs(cut - meaningfulLift) < 1e-9

  const staircaseRows = [
    {
      cut: 0,
      label: "B is better than A at all",
      probability: result.probabilityBBeatsA,
    },
    {
      cut: 0.01,
      label: "B is better by more than 1%",
      probability: result.probabilityImprovesOnePercent,
    },
    {
      cut: 0.05,
      label: "B is better by more than 5%",
      probability: result.probabilityImprovesFivePercent,
    },
    {
      cut: meaningfulLift,
      label: `B is better by more than ${meaningfulLabel} (your bar)`,
      probability: result.probabilityMeaningfulLift,
      emphasis: true,
    },
    {
      cut: 0,
      label: "B is worse than A at all",
      probability: result.probabilityTreatmentHarmful,
    },
    {
      cut: 0.05,
      label: "B is worse by more than 5%",
      probability: result.probabilityHarmFivePercent,
    },
    {
      cut: 0.1,
      label: "B is worse by more than 10%",
      probability: result.probabilityHarmTenPercent,
    },
    {
      cut: meaningfulLift,
      label: `B is worse by more than ${meaningfulLabel} (your bar)`,
      probability: result.probabilityMeaningfulHarm,
      emphasis: true,
    },
  ].filter((row) => row.emphasis || !isThreshold(row.cut))

  const regretPoints = [
    { extraVisitors: 0, regret: result.expectedRegretIfShipNow },
    ...result.waitingScenarios.map((scenario) => ({
      extraVisitors: scenario.extraVisitorsPerVariant,
      regret: scenario.expectedRegretAfterWaiting,
    })),
  ]

  const variantRows = [
    {
      name: "A",
      visitors: result.visitorsA,
      conversions: result.conversionsA,
      observed: result.observedRateA,
      posterior: result.posteriorMeanA,
    },
    {
      name: "B",
      visitors: result.visitorsB,
      conversions: result.conversionsB,
      observed: result.observedRateB,
      posterior: result.posteriorMeanB,
    },
  ]

  return (
    <div className="plate min-h-screen bg-background pt-16">
      <div className="mx-auto max-w-[78rem] px-6 py-10">
        <form
          onSubmit={handleSubmit}
          className="grid items-start gap-x-12 gap-y-10 lg:grid-cols-[15rem_minmax(0,1fr)]"
        >
          <div className="lg:sticky lg:top-24">
            <p className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
              The experiment
            </p>
            <div className="mt-3 grid">
              <p className="mt-2 plate-label text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                Variant A
              </p>
              <Field
                id="visitors-a"
                label="Visitors"
                value={inputs.visitorsA}
                onChange={setInput("visitorsA")}
              />
              <Field
                id="conversions-a"
                label="Conversions"
                value={inputs.conversionsA}
                onChange={setInput("conversionsA")}
              />

              <p className="mt-6 plate-label text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                Variant B
              </p>
              <Field
                id="visitors-b"
                label="Visitors"
                value={inputs.visitorsB}
                onChange={setInput("visitorsB")}
              />
              <Field
                id="conversions-b"
                label="Conversions"
                value={inputs.conversionsB}
                onChange={setInput("conversionsB")}
              />

              <p className="mt-6 plate-label text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-40">
                Your rules
              </p>
              <Field
                id="threshold"
                label="Act above"
                suffix="%"
                value={inputs.thresholdPercent}
                onChange={setInput("thresholdPercent")}
              />
              <Field
                id="meaningful-lift"
                label="Worth having"
                suffix="%"
                value={inputs.meaningfulLiftPercent}
                onChange={setInput("meaningfulLiftPercent")}
              />
            </div>

            <button
              type="submit"
              className="plate-label mt-6 w-full border border-current/40 py-2 text-[0.7rem] font-medium uppercase tracking-[0.12em] opacity-75 transition-opacity hover:opacity-100"
            >
              Recompute
            </button>

            {error ? (
              <p className="mt-3 text-[0.84rem] text-destructive">{error}</p>
            ) : null}

            <p className="mt-6 text-[0.8rem] leading-relaxed opacity-50">
              &ldquo;Worth having&rdquo; is relative, not percentage points: at
              a {formatPercent(result.posteriorMeanA, 2)} baseline,{" "}
              {meaningfulLabel} means about{" "}
              {formatPercent(result.posteriorMeanA * (1 + meaningfulLift), 2)}.
            </p>
          </div>

          <div className="min-w-0">
            <Row
              note={
                <>
                  Priors are fixed at Beta({FIXED_PRIOR_ALPHA},{" "}
                  {FIXED_PRIOR_BETA}) &mdash; flat, opinionless. Everything
                  below comes from your counts alone.
                </>
              }
            >
              <h1 className="text-[2.4rem] leading-tight">Bayesian A/B Test</h1>
              <p className="mt-4 max-w-[38rem]">
                Two variants, some visitors, some conversions. The useful
                question is not whether the difference is significant but what
                the difference plausibly <em>is</em>, and what acting on it
                today would cost if you are wrong. Everything on this page is
                one distribution, read from several angles.
              </p>
            </Row>

            {!hasInitializedFromUrl ? (
              <Section>Reading the experiment from the URL</Section>
            ) : (
              <>
                <Section>The verdict</Section>
                <Row
                  note={
                    <>
                      The strip runs 0 to 100%. The upright tick is the{" "}
                      {formatPercent(decisionThreshold, 0)} you said you would
                      act above.
                    </>
                  }
                >
                  <p className="mt-4 max-w-[38rem] text-[1.5rem] leading-[1.45]">
                    {VERDICT_HEADLINE[result.decisionStatus]} B converts better
                    than A with probability{" "}
                    <span className="plate-figures">
                      {formatPercent(result.probabilityBBeatsA, 1)}
                    </span>
                    <ProbabilityStrip
                      probability={result.probabilityBBeatsA}
                      threshold={decisionThreshold}
                    />
                    . The lift is most likely{" "}
                    <span className="plate-figures">
                      {lift(result.liftMedian)}
                    </span>
                    , and the data are consistent with anything from{" "}
                    <span className="plate-figures">
                      {lift(result.liftCredibleIntervalLower)}
                    </span>{" "}
                    to{" "}
                    <span className="plate-figures">
                      {lift(result.liftCredibleIntervalUpper)}
                    </span>
                    .
                  </p>
                  <p className="mt-5 max-w-[38rem] opacity-80">
                    Acting today means choosing {result.chosenVariantNow}. If
                    that turns out to be the worse arm, the cost is{" "}
                    <span className="plate-figures">
                      {formatUnsignedPercentagePoints(
                        result.expectedRegretIfShipNow,
                        3
                      )}
                    </span>{" "}
                    of conversion rate in expectation &mdash; about{" "}
                    <span className="plate-figures">
                      {formatExpectedMissedConversions(
                        result.expectedRegretIfShipNow,
                        10000,
                        1
                      )}
                    </span>
                    . You have{" "}
                    <span className="plate-figures">
                      {formatCount(result.visitorsPerVariant)}
                    </span>{" "}
                    visitors per arm of the{" "}
                    <span className="plate-figures">
                      {formatCount(result.requiredVisitorsPerVariant)}
                    </span>{" "}
                    a {meaningfulLabel} effect normally needs, so the evidence
                    is {result.evidenceStrength.toLowerCase()}.
                  </p>
                </Row>

                <Section>
                  Figure 1 &nbsp;&middot;&nbsp; The difference itself
                </Section>
                <Row
                  note={
                    <>
                      Everything else on this page is a summary of this one
                      curve. Its area to the left of the upright rule is the
                      chance B is worse; its area past the right dotted rule is
                      the chance the win is big enough to care about.
                    </>
                  }
                >
                  <div className="mt-6">
                    <LiftDistributionFigure
                      points={result.liftDensity}
                      median={result.liftMedian}
                      intervalLower={result.liftCredibleIntervalLower}
                      intervalUpper={result.liftCredibleIntervalUpper}
                      innerLower={result.liftInnerIntervalLower}
                      innerUpper={result.liftInnerIntervalUpper}
                      meaningfulLift={meaningfulLift}
                    />
                  </div>
                  <Caption>
                    Posterior density of B&rsquo;s lift over A. The shaded left
                    tail is the{" "}
                    {formatPercent(result.probabilityTreatmentHarmful, 1)} of
                    the distribution where B is the worse variant. The bar
                    beneath the curve spans the central 95%, thickened across
                    the central 50%, with the median at the dot.{" "}
                    {formatPercent(result.probabilityMeaningfulLift, 1)} of the
                    distribution lies past {meaningfulLabel};{" "}
                    {formatPercent(result.probabilityMeaningfulHarm, 1)} lies
                    below &minus;{meaningfulLabel}.
                  </Caption>
                </Row>

                <Section>
                  Figure 2 &nbsp;&middot;&nbsp; The same curve, cut at
                  thresholds
                </Section>
                <Row
                  note={
                    <>
                      Read down the dots: the descending staircase is the
                      distribution again, sampled at the thresholds people
                      actually argue about.
                    </>
                  }
                >
                  <ProbabilityStaircase
                    rows={staircaseRows}
                    threshold={decisionThreshold}
                  />
                  <Caption>
                    The chance that each statement is true, given the data. The
                    upright tick on every row is your{" "}
                    {formatPercent(decisionThreshold, 0)} bar for acting.
                  </Caption>
                </Row>

                <Section>
                  Figure 3 &nbsp;&middot;&nbsp; The two variants
                </Section>
                <Row
                  note={
                    <>
                      Observed rates are what happened; posterior means are what
                      happened after a flat prior pulls them a hair toward each
                      other. With counts this size the two barely differ.
                    </>
                  }
                >
                  <div className="mt-6 grid items-start gap-x-10 gap-y-6 lg:grid-cols-[1fr_1fr]">
                    <table className="plate-data w-full text-[0.85rem]">
                      <thead>
                        <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                          <th className="py-1 text-left font-medium">
                            Variant
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Visitors
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Conv.
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Observed
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Posterior
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantRows.map((row) => (
                          <tr key={row.name}>
                            <td className="py-1.5">{row.name}</td>
                            <td className="py-1.5 pl-5 text-right">
                              {formatCount(row.visitors)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {formatCount(row.conversions)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {formatPercent(row.observed)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {formatPercent(row.posterior)}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t border-current/25">
                          <td className="py-1.5 opacity-70" colSpan={3}>
                            B &minus; A
                          </td>
                          <td className="py-1.5 pl-5 text-right">
                            {formatPercentagePoints(
                              result.observedAbsoluteDifference
                            )}
                          </td>
                          <td className="py-1.5 pl-5 text-right">
                            {formatPercentagePoints(
                              result.posteriorAbsoluteDifference
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <div>
                      <RateDistributionFigure
                        points={result.chartData}
                        meanA={result.posteriorMeanA}
                        meanB={result.posteriorMeanB}
                      />
                    </div>
                  </div>
                  <Caption>
                    Plausible conversion rates for each variant, A dashed and B
                    solid. Where the two curves overlap is where the data still
                    cannot tell them apart.
                  </Caption>
                </Row>

                <Section>
                  Figure 4 &nbsp;&middot;&nbsp; What waiting buys
                </Section>
                <Row
                  note={
                    <>
                      Regret is measured in conversion-rate points you give up
                      by picking the wrong arm, averaged over everything the
                      posterior still considers possible.
                    </>
                  }
                >
                  <div className="mt-6 grid items-start gap-x-10 gap-y-6 lg:grid-cols-[1fr_1fr]">
                    <div>
                      <RegretDecayFigure points={regretPoints} />
                    </div>

                    <table className="plate-data w-full text-[0.85rem]">
                      <thead>
                        <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                          <th className="py-1 text-left font-medium">
                            Extra / arm
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Regret
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Saved
                          </th>
                          <th className="py-1 pl-5 text-right font-medium">
                            Per 10k
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-1.5">ship now</td>
                          <td className="py-1.5 pl-5 text-right">
                            {(result.expectedRegretIfShipNow * 100).toFixed(4)}
                          </td>
                          <td className="py-1.5 pl-5 text-right opacity-40">
                            &mdash;
                          </td>
                          <td className="py-1.5 pl-5 text-right opacity-40">
                            &mdash;
                          </td>
                        </tr>
                        {result.waitingScenarios.map((scenario) => (
                          <tr key={scenario.extraVisitorsPerVariant}>
                            <td className="py-1.5">
                              +{formatCount(scenario.extraVisitorsPerVariant)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {(
                                scenario.expectedRegretAfterWaiting * 100
                              ).toFixed(4)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {(scenario.valueOfWaiting * 100).toFixed(4)}
                            </td>
                            <td className="py-1.5 pl-5 text-right">
                              {(scenario.valueOfWaiting * 10000).toFixed(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Caption>
                    Expected regret, in percentage points, if you decide now
                    versus after more traffic. The last column turns the saving
                    into conversions per 10,000 future visitors &mdash; the
                    number worth weighing against however long the extra traffic
                    takes to collect.
                  </Caption>
                </Row>

                <Section>Notes</Section>
                <Row
                  note={
                    <>
                      <a
                        className="underline underline-offset-4"
                        href="https://www.evanmiller.org/bayesian-ab-testing.html"
                        rel="noreferrer"
                        target="_blank"
                      >
                        Evan Miller, Bayesian A/B Testing
                      </a>{" "}
                      for the closed form behind the win probability.
                    </>
                  }
                >
                  <div className="mt-4 max-w-[38rem] space-y-3 text-[0.9rem] leading-relaxed opacity-70">
                    <p>
                      Posteriors are Beta(
                      {formatCount(result.posteriorAlphaA)},{" "}
                      {formatCount(result.posteriorBetaA)}) for A and Beta(
                      {formatCount(result.posteriorAlphaB)},{" "}
                      {formatCount(result.posteriorBetaB)}) for B. Interval and
                      threshold probabilities come from sampling those two; the
                      win probability is closed form.
                    </p>
                    <p>
                      With this much traffic the smallest relative effect the
                      test can resolve is about{" "}
                      {formatPercent(result.detectableEffectRelative, 0)}.
                      Reaching the {meaningfulLabel} target needs roughly{" "}
                      {formatCount(result.additionalVisitorsForStableEstimate)}{" "}
                      more visitors per arm.
                    </p>
                    <p>
                      A familiar landmark, recorded but not used: if the two
                      variants were truly identical, a split this lopsided or
                      worse would turn up about{" "}
                      {formatPercent(result.pValueTwoSided, 1)} of the time.
                    </p>
                  </div>
                </Row>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
