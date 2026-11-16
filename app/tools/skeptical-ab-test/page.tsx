"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type {
  CalibrationResult,
  SkepticalResult,
  SkepticalWarning,
} from "bayes-ab"

import { Caption, ProbabilityStrip, Row, Section } from "@/shared/ui/plate"
import { signedPercent } from "@/shared/lib/plot"

import {
  PastTestsFigure,
  PullFigure,
  SensitivityFigure,
  WeightStrip,
} from "./figures"
import {
  EXAMPLE_PAST_TESTS,
  calibrate,
  createSearchParamsFromInputs,
  formatCount,
  formatPercent,
  formatLossPoints,
  formatSpreadInput,
  getInitialAnalysis,
  getInitialInputs,
  getInputsFromSearchParams,
  validateAndCalculate,
  type Analysis,
  type Inputs,
} from "./model"

const VERDICT_HEADLINE: Record<SkepticalResult["decision"]["status"], string> =
  {
    ship_b: "Ship B.",
    keep_a: "Keep A.",
    continue: "Keep the test running.",
    no_meaningful_difference: "Call it a tie.",
  }

const DECISION_SUMMARY: Record<SkepticalResult["decision"]["status"], string> =
  {
    ship_b: "Both conditions for shipping B are met.",
    keep_a: "Both conditions for keeping A are met.",
    continue:
      "Neither block is complete and the tie rule does not apply, so the test needs more data.",
    no_meaningful_difference:
      "Neither variant clears its block, but the data pin the lift inside the tie band: whichever you keep, the difference is too small to matter.",
  }

function formatPerTenThousand(rate: number): string {
  const conversions = rate * 10000
  return conversions.toFixed(conversions < 1 ? 2 : 1)
}

const WARNING_TEXT: Record<SkepticalWarning, string> = {
  few_conversions:
    "A variant has fewer than 30 conversions. The normal approximation this page uses is rough at counts that small.",
  zero_or_all_conversions:
    "A variant has no conversions (or every visitor converted), so half a conversion was added to keep the arithmetic finite.",
  decision_sensitive_to_prior:
    "The decision changes with the prior spread (Figure 3), so the data have not settled it yet.",
}

const CALIBRATION_WARNING_TEXT: Record<
  CalibrationResult["warnings"][number],
  string
> = {
  few_tests: "With fewer than 10 tests, treat the spread as a rough guess.",
  no_spread_beyond_noise:
    "These lifts vary no more than noise alone would explain, so the spread was raised to its 0.5% floor.",
  average_not_zero:
    "These tests lean clearly one way on average. The prior here is still centred on zero.",
}

const label =
  "plate-label text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70"

function Field({
  id,
  label: text,
  prefix,
  suffix,
  value,
  onChange,
}: {
  id: string
  label: string
  prefix?: string
  suffix?: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <label
      htmlFor={id}
      className="grid grid-cols-[1fr_auto] items-baseline gap-3 border-b border-current/20 py-1.5 transition-colors has-[:focus]:border-current/70"
    >
      <span className={label}>{text}</span>
      <span className="flex items-baseline gap-1">
        {prefix ? (
          <span className="text-[0.8em] opacity-50">{prefix}</span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="plate-data w-[5.5rem] bg-transparent text-right text-[1.05rem] outline-none"
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          required
        />
        {suffix ? (
          <span className="w-2 text-[0.8em] opacity-50">{suffix}</span>
        ) : (
          <span className="w-2" aria-hidden />
        )}
      </span>
    </label>
  )
}

function Met({ value }: { value: boolean }) {
  return (
    <span className={value ? "" : "opacity-50"}>
      {value ? "yes" : "not yet"}
    </span>
  )
}

export default function SkepticalAbTestPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [inputs, setInputs] = React.useState<Inputs>(getInitialInputs)
  const [hasInitializedFromUrl, setHasInitializedFromUrl] =
    React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [analysis, setAnalysis] = React.useState<Analysis>(getInitialAnalysis)
  const [pastTests, setPastTests] = React.useState("")
  const [calibration, setCalibration] =
    React.useState<CalibrationResult | null>(null)
  const [calibrationError, setCalibrationError] = React.useState<string | null>(
    null
  )

  React.useEffect(() => {
    const nextInputs = searchParams
      ? getInputsFromSearchParams(searchParams)
      : getInitialInputs()
    const nextState = validateAndCalculate(nextInputs)
    setInputs(nextInputs)
    setError(nextState.error)
    if (nextState.analysis) setAnalysis(nextState.analysis)
    setHasInitializedFromUrl(true)
  }, [searchParams])

  const setInput = (key: keyof Inputs) => (next: string) =>
    setInputs((previous) => ({ ...previous, [key]: next }))

  const apply = (nextInputs: Inputs) => {
    const nextState = validateAndCalculate(nextInputs)
    setError(nextState.error)
    if (!nextState.analysis) return
    setAnalysis(nextState.analysis)
    router.replace(
      `${pathname}?${createSearchParamsFromInputs(nextInputs).toString()}`,
      {
        scroll: false,
      }
    )
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    apply(inputs)
  }

  const handleCalibrate = (text: string) => {
    const state = calibrate(text)
    setCalibrationError(state.error)
    setCalibration(state.calibration)
  }

  const useCalibratedSpread = () => {
    if (!calibration) return
    const nextInputs = {
      ...inputs,
      liftPriorSdPercent: formatSpreadInput(calibration.liftPriorSd),
    }
    setInputs(nextInputs)
    apply(nextInputs)
  }

  const { result, sensitivity } = analysis
  const {
    inputs: used,
    decision,
    logLift,
    weights,
    probability,
    effect,
    expectedLoss,
    sampleSize,
  } = result
  const spreadLabel = `±${formatPercent(used.liftPriorSd, 1)}`
  const bandLabel = `±${formatPercent(used.minEffect, 0)}`
  const lossLabel = formatPercent(used.maxRelativeLoss, 2)
  const thresholdLabel = formatPercent(used.threshold, 0)
  const smallerArm = Math.min(used.visitorsA, used.visitorsB)
  const lift = (value: number | null) =>
    value === null ? "n/a" : signedPercent(value)
  const robust = result.sensitivity.robust

  const checkRows = [
    {
      group: "Ship B",
      check: "B is better than A",
      bar: `${thresholdLabel} sure`,
      now: "see verdict",
      met: decision.checks.bBeatsAReached,
    },
    {
      group: "",
      check: "Expected loss if you ship B",
      bar: `≤ ${lossLabel}`,
      now: formatPercent(expectedLoss.shipBRelative, 3),
      met: decision.checks.shipBLossAcceptable,
    },
    {
      group: "Keep A",
      check: "A is better than B",
      bar: `${thresholdLabel} sure`,
      now: formatPercent(probability.aBeatsB, 1),
      met: decision.checks.aBeatsBReached,
    },
    {
      group: "",
      check: "Expected loss if you keep A",
      bar: `≤ ${lossLabel}`,
      now: formatPercent(expectedLoss.shipARelative, 3),
      met: decision.checks.keepALossAcceptable,
    },
    {
      group: "Tie",
      check: `95% interval inside ${bandLabel}, data outweighing the prior`,
      bar: "",
      now: "",
      met: decision.checks.withinNoEffectBand,
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
            <p className={label}>The experiment</p>
            <div className="mt-3 grid">
              <p className={`mt-2 ${label}`}>Variant A</p>
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

              <p className={`mt-6 ${label}`}>Variant B</p>
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

              <p className={`mt-6 ${label}`}>Your prior</p>
              <Field
                id="lift-prior-sd"
                label="Typical lift"
                prefix="±"
                suffix="%"
                value={inputs.liftPriorSdPercent}
                onChange={setInput("liftPriorSdPercent")}
              />

              <p className={`mt-6 ${label}`}>Your rules</p>
              <Field
                id="threshold"
                label="Act above"
                suffix="%"
                value={inputs.thresholdPercent}
                onChange={setInput("thresholdPercent")}
              />
              <Field
                id="max-loss"
                label="Max loss"
                suffix="%"
                value={inputs.maxLossPercent}
                onChange={setInput("maxLossPercent")}
              />
              <Field
                id="band"
                label="Tie band"
                prefix="±"
                suffix="%"
                value={inputs.meaningfulLiftPercent}
                onChange={setInput("meaningfulLiftPercent")}
              />
            </div>

            <button
              type="submit"
              className="plate-label mt-6 w-full border border-current/40 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-75 transition-opacity hover:opacity-100"
            >
              Recompute
            </button>

            {error ? (
              <p className="mt-3 text-[0.85em] text-destructive">{error}</p>
            ) : null}

            <p className="mt-6 text-[0.8em] leading-[1.4] opacity-70">
              &ldquo;Typical lift&rdquo; is how big real differences between
              variants usually are in your tests: at ±4%, most fall within about
              ±8%. Set it from your own history below.
            </p>
            <p className="mt-3 text-[0.8em] leading-[1.4] opacity-70">
              Max loss is relative to the baseline rate: 0.1% of a 2% rate is
              0.002 percentage points.
            </p>
          </div>

          <div className="min-w-0">
            <Row
              note={
                <>
                  The flat-prior version is the{" "}
                  <Link
                    className="underline underline-offset-4"
                    href="/tools/bayesian-ab-test"
                  >
                    Bayesian A/B Test
                  </Link>
                  . Same counts, different starting belief.
                </>
              }
            >
              <h1 className="text-[1.9rem] leading-tight">
                Skeptical A/B Test
              </h1>
              <p className="mt-4 max-w-[35em]">
                Most tests barely move the needle, and a small test with a big
                lift is usually a lucky draw rather than a big win. This
                calculator starts from that belief: before seeing your data it
                expects the lift to be near zero, and the data have to earn
                their way out. Early, noisy results get pulled back toward zero;
                large, consistent ones come through.
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
                      {thresholdLabel} you said you would act above.
                    </>
                  }
                >
                  <p className="mt-4 max-w-[35em] text-[1.25rem] leading-[1.4] sm:text-[1.5rem]">
                    {VERDICT_HEADLINE[decision.status]} B converts better than A
                    with probability{" "}
                    <span className="whitespace-nowrap">
                      <span className="plate-figures">
                        {formatPercent(probability.bBeatsA, 1)}
                      </span>
                      <ProbabilityStrip
                        probability={probability.bBeatsA}
                        threshold={used.threshold}
                      />
                      .
                    </span>{" "}
                    Your counts alone say{" "}
                    <span className="plate-figures">
                      {lift(effect.observedRelativeLift)}
                    </span>
                    ; weighed against how big lifts usually are, it is most
                    likely{" "}
                    <span className="plate-figures">
                      {lift(effect.relativeLift)}
                    </span>
                    , and anywhere from{" "}
                    <span className="plate-figures">
                      {lift(effect.relativeLiftCI95[0])}
                    </span>{" "}
                    to{" "}
                    <span className="plate-figures">
                      {lift(effect.relativeLiftCI95[1])}
                    </span>
                    .
                  </p>
                  {result.warnings.length > 0 ? (
                    <div className="mt-5 max-w-[35em] space-y-2 opacity-80">
                      {result.warnings.map((warning) => (
                        <p key={warning}>{WARNING_TEXT[warning]}</p>
                      ))}
                    </div>
                  ) : null}
                </Row>

                <Section>What the decision needs</Section>
                <Row
                  note={
                    <>
                      Shipping needs both lines in its block. Being probably
                      better is not enough if the cost of being wrong is still
                      large; a small expected loss is what &ldquo;make sure it
                      is not worse&rdquo; means in numbers.
                    </>
                  }
                >
                  <table className="plate-data mt-6 w-full max-w-[44rem] text-[0.94rem]">
                    <thead>
                      <tr className="plate-label border-b border-current/25 text-[0.8rem] uppercase tracking-[0.1em] opacity-70">
                        <th className="py-1 text-left font-medium">Call</th>
                        <th className="py-1 pl-5 text-left font-medium">
                          Condition
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Bar
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Now
                        </th>
                        <th className="py-1 pl-5 text-right font-medium">
                          Met
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkRows.map((row) => (
                        <tr
                          key={row.check}
                          className={
                            row.group && row.group !== "Ship B"
                              ? "border-t border-current/15"
                              : ""
                          }
                        >
                          <td className="py-1.5 align-top whitespace-nowrap">
                            {row.group}
                          </td>
                          <td className="py-1.5 pl-5 align-top">{row.check}</td>
                          <td className="py-1.5 pl-5 text-right align-top whitespace-nowrap">
                            {row.bar}
                          </td>
                          <td className="py-1.5 pl-5 text-right align-top whitespace-nowrap">
                            <span
                              className={
                                row.now === "see verdict" ? "opacity-40" : ""
                              }
                            >
                              {row.now}
                            </span>
                          </td>
                          <td className="py-1.5 pl-5 text-right align-top whitespace-nowrap">
                            <Met value={row.met} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Caption>
                    Losses are relative to the baseline rate. Shipping B today
                    would cost {formatLossPoints(expectedLoss.shipB)} of
                    conversion rate in expectation, about{" "}
                    {formatPerTenThousand(expectedLoss.shipB)} conversions per
                    10,000 visitors. {DECISION_SUMMARY[decision.status]}
                  </Caption>
                </Row>

                <Section>Figure 1&nbsp;&middot; The pull toward zero</Section>
                <Row
                  note={
                    <>
                      Three curves on one axis. Dotted: the prior, what you
                      expected before the test. Dashed: what the counts say on
                      their own. Solid: the two combined. The solid curve always
                      sits between the other two and is narrower than either.
                    </>
                  }
                >
                  <div className="mt-6">
                    <PullFigure
                      points={result.chart ?? []}
                      priorSd={logLift.priorSd}
                      noise={logLift.noise}
                      posteriorSd={logLift.posteriorSd}
                      observed={effect.observedRelativeLift ?? 0}
                      median={effect.relativeLift}
                      lower={effect.relativeLiftCI95[0]}
                      upper={effect.relativeLiftCI95[1]}
                      minEffect={used.minEffect}
                    />
                  </div>
                  <Caption>
                    Densities of B&rsquo;s lift over A, drawn at their true
                    heights. The counts alone centre on{" "}
                    {lift(effect.observedRelativeLift)} with noise of about ±
                    {formatPercent(logLift.noise, 1)}; the prior centres on zero
                    with a spread of {spreadLabel}. The estimate lands{" "}
                    {Math.round(weights.dataShare * 100)}% of the way from zero
                    to the data, at {lift(effect.relativeLift)}. The bar beneath
                    spans its central 95%, the dotted rules the {bandLabel} tie
                    band.
                  </Caption>
                </Row>

                <Section>
                  Figure 2&nbsp;&middot; How much the data weigh
                </Section>
                <Row
                  note={
                    <>
                      Each side is weighted by how precise it is: one over its
                      spread squared. A larger test means less noise, a heavier
                      data side, and less pull.
                    </>
                  }
                >
                  <WeightStrip dataShare={weights.dataShare} />
                  <Caption>
                    The prior counts as much as about{" "}
                    {formatCount(weights.priorEquivalentVisitorsPerVariant)}{" "}
                    visitors per variant at this baseline; the test has{" "}
                    {formatCount(smallerArm)}.{" "}
                    {weights.dataShare < 0.5
                      ? "Until the data outweigh it, the estimate stays closer to zero than to what you observed."
                      : "The data now outweigh the prior, so the estimate follows what you observed more than what you expected."}
                  </Caption>
                </Row>

                <Section>
                  Figure 3&nbsp;&middot; Does the answer depend on the prior?
                </Section>
                <Row
                  note={
                    <>
                      The prior is a judgment call, so check it. If halving or
                      raising it by half changes the call, the call rests on the
                      prior rather than the data.
                    </>
                  }
                >
                  <div className="mt-6">
                    <SensitivityFigure
                      rows={sensitivity}
                      minEffect={used.minEffect}
                    />
                  </div>
                  <Caption>
                    The same counts under three priors: half yours, yours (
                    {spreadLabel}, solid), and half again. Each line is the 95%
                    interval with the estimate at the dot.{" "}
                    {robust
                      ? "All three reach the same call, so the decision does not hinge on the exact prior."
                      : "They disagree, so the decision is not settled; more data will make the prior matter less."}
                  </Caption>
                </Row>

                <Section>Setting the prior from past tests</Section>
                <Row
                  note={
                    <>
                      Past lifts vary for two reasons: real differences between
                      tests, and noise within each. The estimate subtracts the
                      second from the first (DerSimonian and Laird&rsquo;s
                      method from meta-analysis).
                    </>
                  }
                >
                  <p className="mt-4 max-w-[35em]">
                    The best source for the typical lift is your own history.
                    Paste past tests, one per line as visitors A, conversions A,
                    visitors B, conversions B. Ten or more is better than a few.
                  </p>
                  <textarea
                    aria-label="Past tests, one per line: visitorsA,conversionsA,visitorsB,conversionsB"
                    className="plate-data mt-4 block h-40 w-full max-w-[44rem] resize-y border border-current/25 bg-transparent p-2 text-[0.9rem] leading-[1.4] outline-none focus:border-current/60"
                    placeholder="visitorsA,conversionsA,visitorsB,conversionsB"
                    value={pastTests}
                    onChange={(event) => setPastTests(event.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleCalibrate(pastTests)}
                      className="plate-label border border-current/40 px-4 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-75 transition-opacity hover:opacity-100"
                    >
                      Estimate the spread
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPastTests(EXAMPLE_PAST_TESTS)
                        handleCalibrate(EXAMPLE_PAST_TESTS)
                      }}
                      className="plate-label px-2 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-60 underline-offset-4 transition-opacity hover:underline hover:opacity-100"
                    >
                      Load made-up example
                    </button>
                  </div>
                  {calibrationError ? (
                    <p className="mt-3 text-[0.85em] text-destructive">
                      {calibrationError}
                    </p>
                  ) : null}

                  {calibration ? (
                    <>
                      <p className="mt-6 max-w-[35em]">
                        Across {calibration.tests} tests the observed lifts
                        spread about ±
                        <span className="plate-figures">
                          {formatPercent(calibration.observedSd, 1)}
                        </span>
                        . A single test&rsquo;s noise is about ±
                        <span className="plate-figures">
                          {formatPercent(calibration.typicalNoise, 1)}
                        </span>
                        {calibration.floored
                          ? ", which explains all of that variation: these tests cannot tell real lifts apart from luck, so the spread falls back to its floor of "
                          : ". Take the noise out and what is left, the spread of real lifts, is "}
                        <span className="plate-figures">
                          ±{formatPercent(calibration.liftPriorSd, 1)}
                        </span>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={useCalibratedSpread}
                        className="plate-label mt-4 border border-current/40 px-4 py-2 text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-75 transition-opacity hover:opacity-100"
                      >
                        Use ±{formatSpreadInput(calibration.liftPriorSd)}% as
                        the prior
                      </button>
                      <div className="mt-6">
                        <PastTestsFigure calibration={calibration} />
                      </div>
                      <Caption>
                        Each past test&rsquo;s observed lift, sorted, with its
                        own 95% noise interval. The shaded band is ±2 of the
                        suggested spread, where real lifts mostly fall. Tests
                        whose intervals dwarf the band were too small to say
                        much on their own.
                      </Caption>
                      {calibration.warnings.length > 0 ? (
                        <div className="mt-3 max-w-[35em] space-y-2 text-[0.9em] opacity-75">
                          {calibration.warnings.map((warning) => (
                            <p key={warning}>
                              {CALIBRATION_WARNING_TEXT[warning]}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </Row>

                <Section>Notes</Section>
                <Row
                  note={
                    <>
                      The same analysis runs on the command line as{" "}
                      <code className="text-[0.95em]">
                        npx bayes-ab skeptical
                      </code>
                      , and{" "}
                      <code className="text-[0.95em]">bayes-ab calibrate</code>{" "}
                      reads past tests from a CSV.
                    </>
                  }
                >
                  <div className="mt-4 max-w-[35em] space-y-3 text-[0.9em] leading-[1.4] opacity-70">
                    <p>
                      The model works on the log lift, ln(rate B / rate A). Its
                      prior is normal with mean zero and spread {spreadLabel}.
                      The counts give an observed log lift of{" "}
                      {logLift.observed.toFixed(4)} with noise{" "}
                      {logLift.noise.toFixed(4)}, from √(1/c<sub>A</sub> − 1/n
                      <sub>A</sub> + 1/c<sub>B</sub> − 1/n<sub>B</sub>). The
                      posterior is normal too, the precision-weighted average of
                      the two: mean {logLift.posteriorMean.toFixed(4)}, spread{" "}
                      {logLift.posteriorSd.toFixed(4)}. Every probability and
                      loss on this page is closed form on that posterior; none
                      is sampled.
                    </p>
                    <p>
                      Detecting a {bandLabel} difference at 80% power would take
                      about {formatCount(sampleSize.requiredPerVariant)}{" "}
                      visitors per variant at a{" "}
                      {formatPercent(sampleSize.baselineRate, 2)} baseline. The
                      test has {formatPercent(sampleSize.progress, 0)} of that.
                    </p>
                    <p>
                      The normal approximation is good from a few dozen
                      conversions per variant. Below that, the{" "}
                      <Link
                        className="underline underline-offset-4"
                        href="/tools/bayesian-ab-test"
                      >
                        flat-prior calculator
                      </Link>{" "}
                      handles small counts exactly, though it does not shrink
                      the lift.
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
