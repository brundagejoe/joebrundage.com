"use client"

import * as React from "react"

import { Caption, ProbabilityStrip, Row, Section } from "@/shared/ui/plate"

import {
  BetaCurveFigure,
  LossProjectionFigure,
  PosteriorPairFigure,
  SampleSizeOverlayFigure,
  WeekSmallMultiples,
} from "./figures"
import {
  BetaDensityFormula,
  BetaFunctionFormula,
  ExpectedLossFormula,
  InlineMath,
  MinimumSampleSizeFormula,
  PosteriorUpdateCountsFormula,
  PosteriorUpdateFormula,
  ProbBBeatsAFormula,
  RiemannPassFormula,
  StoppingThresholdFormula,
} from "./math"
import {
  createAbComparisonData,
  createBetaChartData,
  createLossCurveData,
  createOverlayBetaChartData,
  createWorkedExample,
  computeExpectedLoss,
  formatCount,
  formatProbability,
  formatSliderValue,
  TRUE_CONTROL_RATE,
  TRUE_VARIANT_RATE,
} from "./model"

function Control({
  id,
  label,
  display,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string
  label: string
  display: string
  min: number
  max: number
  step: number
  value: number
  onChange: (next: number) => void
}) {
  return (
    <div className="grid content-start gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.1em] opacity-60"
        >
          {label}
        </label>
        <span className="plate-data text-[0.85rem]">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className="plate-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  )
}

function ControlStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 grid gap-x-8 gap-y-4 border-t border-current/20 pt-4 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  )
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="max-w-[38rem] space-y-4">{children}</div>
}

function Aside({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <>
      <h3 className="mt-10 text-[1.35rem]">{title}</h3>
      <div className="mt-3 max-w-[38rem] space-y-4">{children}</div>
    </>
  )
}

const SAMPLE_SIZES = [
  { key: "n100" as const, n: 100, label: "N = 100" },
  { key: "n500" as const, n: 500, label: "N = 500" },
  { key: "n2000" as const, n: 2000, label: "N = 2,000" },
]

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

  const betaCurve = React.useMemo(
    () => createBetaChartData(alpha, beta),
    [alpha, beta]
  )

  const sampleSizeSeries = React.useMemo(
    () =>
      SAMPLE_SIZES.map(({ key, n, label }) => {
        const successes = Math.round(n * 0.05)
        return {
          key,
          n,
          label,
          successes,
          failures: n - successes,
          alpha: 1 + successes,
          beta: 1 + (n - successes),
        }
      }),
    []
  )
  const sampleSizeChart = React.useMemo(
    () => createOverlayBetaChartData(sampleSizeSeries),
    [sampleSizeSeries]
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
    return {
      ...createAbComparisonData(alphaA, betaA, alphaB, betaB),
      ...computeExpectedLoss(alphaA, betaA, alphaB, betaB),
    }
  }, [s4ControlRate, s4VariantRate, s4N])

  const sectionFive = React.useMemo(
    () => createLossCurveData(s5ControlRate / 100, s5VariantRate / 100, s5N),
    [s5ControlRate, s5VariantRate, s5N]
  )

  const weeks = React.useMemo(() => createWorkedExample(), [])
  const week = weeks[s6Week - 1]

  return (
    <div className="plate min-h-screen bg-background pt-16">
      <article className="mx-auto max-w-[64rem] px-6 py-10">
        <Row
          note={
            <>
              Every section builds on the one before it. Read straight through,
              or move the controls under any figure and watch what changes.
            </>
          }
        >
          <p className="plate-label text-[0.66rem] font-medium uppercase tracking-[0.16em] opacity-55">
            BABTP
          </p>
          <h1 className="mt-3 text-[2.4rem] leading-tight">
            Bayesian A/B Testing Primer
          </h1>
          <p className="mt-4 max-w-[38rem]">
            Six sections, one idea. A conversion rate is a probability you do
            not know, so you represent it with a distribution rather than a
            number. Everything that follows — posterior updating, the chance one
            variant beats another, the cost of deciding early — is that one move
            applied again and again.
          </p>
        </Row>

        {/* ─── Section 1 ─────────────────────────────────────────── */}
        <Section>Section 1 &nbsp;&middot;&nbsp; The Beta distribution</Section>
        <Row
          note={
            <>
              The Beta family is bounded to the interval a probability lives on,
              which is why it is the workhorse here.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">
            A distribution over a probability
          </h2>
          <Prose>
            <p>
              The Beta distribution is the standard prior and posterior for a
              conversion probability: flexible, bounded between 0 and 1, and it
              updates cleanly after observing successes and failures. Its
              density is
            </p>
          </Prose>
          <BetaDensityFormula />
          <Prose>
            <p>
              where <InlineMath>p</InlineMath> is a probability between 0 and 1,
              and{" "}
              <InlineMath>
                <span>&alpha;</span>
              </InlineMath>{" "}
              and{" "}
              <InlineMath>
                <span>&beta;</span>
              </InlineMath>{" "}
              are the shape parameters. The normalizing term{" "}
              <InlineMath>
                <span>B(&alpha;, &beta;)</span>
              </InlineMath>{" "}
              is the Beta function — the constant that makes the area under the
              curve exactly 1, so the curve is a valid distribution.
            </p>
          </Prose>
          <BetaFunctionFormula />
          <Prose>
            <p>
              A larger <span className="italic">α</span> pulls belief toward
              higher conversion probabilities, a larger{" "}
              <span className="italic">β</span> toward lower ones. When both are
              1 the distribution is flat, which is why{" "}
              <InlineMath>Beta(1, 1)</InlineMath> is the usual neutral starting
              point.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              Move <span className="italic">α</span> up to push mass right,{" "}
              <span className="italic">β</span> up to push it left. Equal values
              above 1 concentrate belief in the middle.
            </>
          }
        >
          <div className="mt-8">
            <BetaCurveFigure points={betaCurve} alpha={alpha} beta={beta} />
          </div>
          <ControlStrip>
            <Control
              id="beta-alpha"
              label="Alpha"
              display={formatSliderValue(alpha)}
              min={1}
              max={12}
              step={0.5}
              value={alpha}
              onChange={setAlpha}
            />
            <Control
              id="beta-beta"
              label="Beta"
              display={formatSliderValue(beta)}
              min={1}
              max={12}
              step={0.5}
              value={beta}
              onChange={setBeta}
            />
          </ControlStrip>
          <Caption>
            The current prior is Beta({formatProbability(alpha)},{" "}
            {formatProbability(beta)}), with a mean of{" "}
            {((alpha / (alpha + beta)) * 100).toFixed(1)}%. The shaded region is
            the whole density, and its area is always 1 however you move the
            parameters.
          </Caption>
        </Row>

        <Row>
          <Aside title="Why this matters for A/B testing">
            <p>
              A conversion rate is a probability, so we want a distribution
              defined on probabilities. The Beta family gives a compact language
              for prior belief and an easy update rule once data arrives. It is
              also conjugate to the binomial likelihood, which means the
              posterior stays Beta after you observe data:
            </p>
          </Aside>
          <PosteriorUpdateFormula />
        </Row>

        {/* ─── Section 2 ─────────────────────────────────────────── */}
        <Section>
          Section 2 &nbsp;&middot;&nbsp; From shape to conversion data
        </Section>
        <Row
          note={
            <>
              α is the success side of the story, β the failure side. If
              conversions are rare, β grows much faster than α.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">Counting into the shape</h2>
          <Prose>
            <p>
              In an A/B test, <span className="italic">α</span> and{" "}
              <span className="italic">β</span> stop feeling abstract as soon as
              you connect them to outcomes. Start from a neutral Beta(1, 1),
              then add successes to α and failures to β.
            </p>
          </Prose>
          <PosteriorUpdateCountsFormula />
          <Prose>
            <p>
              As the sample grows the curve narrows, because the posterior
              becomes more certain. To make the squeezing obvious, hold the
              conversion rate fixed at 5% and compare three sample sizes.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              All three curves sit on the same centre. The only thing that
              changes is width — which is exactly what more data buys.
            </>
          }
        >
          <div className="mt-8">
            <SampleSizeOverlayFigure
              points={sampleSizeChart.points}
              maxDensity={sampleSizeChart.maxDensity}
              series={SAMPLE_SIZES.map(({ key, label }) => ({
                key,
                label,
              }))}
            />
          </div>
          <table className="plate-data mt-6 w-full max-w-[34rem] text-[0.85rem]">
            <thead>
              <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                <th className="py-1 text-left font-medium">Sample</th>
                <th className="py-1 pl-5 text-right font-medium">Successes</th>
                <th className="py-1 pl-5 text-right font-medium">Failures</th>
                <th className="py-1 pl-5 text-right font-medium">Alpha</th>
                <th className="py-1 pl-5 text-right font-medium">Beta</th>
              </tr>
            </thead>
            <tbody>
              {sampleSizeSeries.map((row) => (
                <tr key={row.key}>
                  <td className="py-1.5">N = {formatCount(row.n)}</td>
                  <td className="py-1.5 pl-5 text-right">
                    {formatCount(row.successes)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {formatCount(row.failures)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {formatCount(row.alpha)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {formatCount(row.beta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Caption>
            Three posteriors from the same 5% observed rate and a Beta(1, 1)
            prior. At N = 100 the posterior is still broad; by N = 2,000 it has
            squeezed tightly around 5%, which is what it means for data to be
            informative about the underlying rate.
          </Caption>
        </Row>

        {/* ─── Section 3 ─────────────────────────────────────────── */}
        <Section>
          Section 3 &nbsp;&middot;&nbsp; Comparing two posteriors
        </Section>
        <Row
          note={
            <>
              The answer is a probability, not a verdict. That is the whole
              difference from a significance test.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">Which variant is better?</h2>
          <Prose>
            <p>
              Each variant gets its own stream of data, so each gets its own
              posterior. By the time you read results you have two Beta
              distributions side by side, and the question is no longer what the
              rate is — it is which variant is actually better.
            </p>
            <p>
              For every value the variant&rsquo;s rate might take, ask how much
              of the control&rsquo;s posterior falls below it. Integrating
              across the range gives the probability that the variant&rsquo;s
              true rate exceeds the control&rsquo;s:
            </p>
          </Prose>
          <ProbBBeatsAFormula />
          <Prose>
            <p>
              That integral has no closed form for arbitrary parameters, so both
              posteriors are evaluated on a fine grid. Stepping left to right,
              two running totals are maintained at once:
            </p>
          </Prose>
          <RiemannPassFormula />
          <Prose>
            <p>
              The first line builds up the control&rsquo;s CDF incrementally.
              The second weights the variant density at each point by how much
              of the control&rsquo;s distribution lies below it. Both posteriors
              are smooth and well concentrated, so the approximation converges
              quickly.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              Pull the two rates together and watch the posteriors merge. Then
              raise N and watch them narrow until they separate again.
            </>
          }
        >
          <div className="mt-8">
            <PosteriorPairFigure
              points={sectionThree.points}
              maxDensity={sectionThree.maxDensity}
              controlLabel={`A ${abControlRate}%`}
              variantLabel={`B ${abVariantRate}%`}
            />
          </div>
          <ControlStrip>
            <Control
              id="ab-control-rate"
              label="Control (A) rate"
              display={`${abControlRate}%`}
              min={1}
              max={20}
              step={1}
              value={abControlRate}
              onChange={setAbControlRate}
            />
            <Control
              id="ab-variant-rate"
              label="Variant (B) rate"
              display={`${abVariantRate}%`}
              min={1}
              max={20}
              step={1}
              value={abVariantRate}
              onChange={setAbVariantRate}
            />
            <Control
              id="ab-n"
              label="N per variant"
              display={formatCount(abN)}
              min={50}
              max={5000}
              step={50}
              value={abN}
              onChange={setAbN}
            />
          </ControlStrip>
          <p className="mt-5 flex max-w-[38rem] items-baseline gap-2 text-[1.15rem]">
            <span>P(B &gt; A)</span>
            <ProbabilityStrip
              probability={sectionThree.probBBeatsA}
              threshold={0.95}
            />
            <span className="plate-figures">
              {(sectionThree.probBBeatsA * 100).toFixed(1)}%
            </span>
            <span className="text-[0.84rem] opacity-55">tick marks 95%</span>
          </p>
          <Caption>
            Control dashed, variant solid; the shaded region is where they
            overlap. That overlap is the zone of uncertainty — both rates are
            plausible there. When the curves are far apart P(B &gt; A)
            approaches 0 or 1 and the decision is clear. When they nearly
            coincide it drifts toward 50%, which does not mean the test is
            broken: it means the data cannot yet tell the variants apart.
          </Caption>
        </Row>

        <Row>
          <Aside title="Why a probability beats a verdict">
            <p>
              The same 2-point lift at N = 5,000 produces a far more decisive
              result than at N = 100, because more data compresses both
              posteriors without moving their centres.
            </p>
            <p>
              Instead of a binary reject-or-not decision, you get a continuous
              probability that can be monitored, communicated, and acted on as
              evidence accumulates.
            </p>
          </Aside>
        </Row>

        {/* ─── Section 4 ─────────────────────────────────────────── */}
        <Section>Section 4 &nbsp;&middot;&nbsp; Expected loss</Section>
        <Row
          note={
            <>Direction is cheap. Stakes are what you actually decide on.</>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">The cost of being wrong</h2>
          <Prose>
            <p>
              P(B &gt; A) gives the direction but not whether acting on it is
              wise. A 90% probability sounds decisive, but if B is only
              fractionally better, the cost of being wrong and the cost of being
              right are nearly the same. The question that drives the decision
              is: how much conversion rate do I sacrifice on average if I choose
              wrong?
            </p>
          </Prose>
          <ExpectedLossFormula />
          <Prose>
            <p>
              Loss<sub>B</sub> is the average conversion rate you give up by
              shipping B if A was secretly better; the{" "}
              <InlineMath>max(&middot;, 0)</InlineMath> counts only the cases
              where A genuinely wins. Loss<sub>A</sub> is the symmetric regret
              of holding B back when it was stronger. Ship whichever variant has
              the lower cost of being wrong about it.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              The wider the overlap, the more both losses cost you — which is
              why deciding early is expensive.
            </>
          }
        >
          <div className="mt-8">
            <PosteriorPairFigure
              points={sectionFour.points}
              maxDensity={sectionFour.maxDensity}
              controlLabel={`A ${s4ControlRate}%`}
              variantLabel={`B ${s4VariantRate}%`}
            />
          </div>
          <ControlStrip>
            <Control
              id="s4-control-rate"
              label="Control (A) rate"
              display={`${s4ControlRate}%`}
              min={1}
              max={20}
              step={1}
              value={s4ControlRate}
              onChange={setS4ControlRate}
            />
            <Control
              id="s4-variant-rate"
              label="Variant (B) rate"
              display={`${s4VariantRate}%`}
              min={1}
              max={20}
              step={1}
              value={s4VariantRate}
              onChange={setS4VariantRate}
            />
            <Control
              id="s4-n"
              label="N per variant"
              display={formatCount(s4N)}
              min={50}
              max={5000}
              step={50}
              value={s4N}
              onChange={setS4N}
            />
          </ControlStrip>
          <table className="plate-data mt-5 w-full max-w-[26rem] text-[0.85rem]">
            <tbody>
              <tr className="border-b border-current/25">
                <td className="py-1.5">Hold A — cost of withholding B</td>
                <td className="py-1.5 pl-5 text-right">
                  {(sectionFour.lossChooseA * 100).toFixed(3)} pp
                </td>
              </tr>
              <tr>
                <td className="py-1.5">Ship B — cost of shipping early</td>
                <td className="py-1.5 pl-5 text-right">
                  {(sectionFour.lossChooseB * 100).toFixed(3)} pp
                </td>
              </tr>
            </tbody>
          </table>
          <Caption>
            Expected loss for each decision at the current rates and sample
            size. The rule is to ship B when Loss<sub>B</sub> is below Loss
            <sub>A</sub>, which here says{" "}
            {sectionFour.lossChooseB < sectionFour.lossChooseA
              ? "ship B"
              : "hold with A"}
            . Both numbers come from the same left-to-right pass over the grid
            that produced P(B &gt; A).
          </Caption>
        </Row>

        {/* ─── Section 5 ─────────────────────────────────────────── */}
        <Section>
          Section 5 &nbsp;&middot;&nbsp; Should you keep running?
        </Section>
        <Row
          note={
            <>
              The gap between the two curves is the value of more data. A
              near-zero gap means you are done regardless of N.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">What another week buys</h2>
          <Prose>
            <p>
              Expected loss answers whether to act on the data you have. A
              different question is whether collecting more is worth it. If Loss
              <sub>B</sub> is already near zero, another week changes almost
              nothing. If both losses are still high and close together, more
              data has real value because it might separate them.
            </p>
            <p>
              Holding the observed rates constant, you can compute what the
              posterior — and therefore the expected loss — would look like at
              any future N. Both losses shrink as N grows, but not at the same
              rate: when one variant is genuinely better, its loss converges to
              zero much faster than the other.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              The leftmost point is where you are now. The horizontal rule is
              zero loss, so height reads as magnitude.
            </>
          }
        >
          <div className="mt-8">
            <LossProjectionFigure points={sectionFive} />
          </div>
          <ControlStrip>
            <Control
              id="s5-control-rate"
              label="Control (A) rate"
              display={`${s5ControlRate}%`}
              min={1}
              max={20}
              step={1}
              value={s5ControlRate}
              onChange={setS5ControlRate}
            />
            <Control
              id="s5-variant-rate"
              label="Variant (B) rate"
              display={`${s5VariantRate}%`}
              min={1}
              max={20}
              step={1}
              value={s5VariantRate}
              onChange={setS5VariantRate}
            />
            <Control
              id="s5-n"
              label="Current N per variant"
              display={formatCount(s5N)}
              min={50}
              max={2000}
              step={50}
              value={s5N}
              onChange={setS5N}
            />
          </ControlStrip>
          <Caption>
            Both losses projected forward from the current sample, in percentage
            points. Today they stand at {sectionFive[0]?.lossChooseA.toFixed(3)}{" "}
            for holding A and {sectionFive[0]?.lossChooseB.toFixed(3)} for
            shipping B; by N ={" "}
            {formatCount(sectionFive[sectionFive.length - 1]?.n ?? 0)} per arm,
            shipping B costs{" "}
            {sectionFive[sectionFive.length - 1]?.lossChooseB.toFixed(3)}. Where
            one line drops to near zero while the other stays high, the decision
            is settled.
          </Caption>
        </Row>

        <Row
          note={
            <>Choose ε before the test launches, not after you see the data.</>
          }
        >
          <Aside title="Protecting against noise">
            <p>
              Comparing Loss<sub>B</sub> to Loss<sub>A</sub> gives the
              direction. It does not protect against acting too early: in a
              noisy test Loss<sub>B</sub> can be the smaller number on a small
              sample and reverse a week later, because both posteriors are still
              wide and the comparison is fragile. The fix is a pre-committed
              absolute threshold.
            </p>
          </Aside>
          <StoppingThresholdFormula />
          <Prose>
            <p>
              A principled starting point is the minimum lift your business
              would actually act on: if 0.5 percentage points is the smallest
              effect worth shipping, set ε = 0.005. The threshold requires the
              magnitude of the loss to fall below a meaningful level, not merely
              below the other loss. The sample size you need is the point where
              the projected Loss<sub>B</sub> curve first drops under it:
            </p>
          </Prose>
          <MinimumSampleSizeFormula />
          <Prose>
            <p>The full stopping rule is two conditions at once:</p>
            <ol className="ml-5 list-decimal space-y-2">
              <li>
                Loss<sub>B</sub> &lt; ε — the expected regret of shipping is
                below your threshold.
              </li>
              <li>
                N &ge; N<sub>min</sub> — you have enough data for the projection
                to be credible at the observed rates.
              </li>
            </ol>
            <p>
              That rule would have blocked the premature calls in the
              walkthrough below.
            </p>
          </Prose>
        </Row>

        {/* ─── Section 6 ─────────────────────────────────────────── */}
        <Section>Section 6 &nbsp;&middot;&nbsp; A test, week by week</Section>
        <Row
          note={
            <>
              Six weeks of a live test. The true rates were never visible while
              it ran.
            </>
          }
        >
          <h2 className="mt-4 text-[1.6rem]">The recommendation flips twice</h2>
          <Prose>
            <p>
              New users arrive each week and the posteriors update. Below is the
              whole run at once — one small chart per week, control dashed and
              variant solid, on a shared reading. Select a week to read what was
              happening at the time.
            </p>
          </Prose>
        </Row>

        <Row
          note={
            <>
              Read left to right: B leads, A takes it back, B reclaims it. Only
              the last two weeks are worth acting on.
            </>
          }
        >
          <WeekSmallMultiples
            weeks={weeks}
            selected={s6Week}
            onSelect={setS6Week}
          />
          <table className="plate-data mt-8 w-full text-[0.85rem]">
            <thead>
              <tr className="plate-label border-b border-current/25 text-[0.66rem] uppercase tracking-[0.08em] opacity-55">
                <th className="py-1 text-left font-medium">Week</th>
                <th className="py-1 pl-5 text-right font-medium">N / arm</th>
                <th className="py-1 pl-5 text-right font-medium">
                  P(B &gt; A)
                </th>
                <th className="py-1 pl-5 text-right font-medium">Loss A</th>
                <th className="py-1 pl-5 text-right font-medium">Loss B</th>
                <th className="py-1 pl-5 text-right font-medium">Call</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((row) => (
                <tr
                  key={row.week}
                  className={row.week === s6Week ? "" : "opacity-65"}
                >
                  <td className="py-1.5">{row.week}</td>
                  <td className="py-1.5 pl-5 text-right">
                    {formatCount(row.nPerVariant)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {(row.probBBeatsA * 100).toFixed(1)}%
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {(row.lossChooseA * 100).toFixed(3)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">
                    {(row.lossChooseB * 100).toFixed(3)}
                  </td>
                  <td className="py-1.5 pl-5 text-right">{row.call}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Caption>
            Losses are in percentage points. The call column is simply whichever
            loss is smaller — and it flips at week 3 and again at week 5. In
            weeks 1 and 2 both losses are high in absolute terms even though
            Loss<sub>B</sub> is the smaller one: the signature of a wide
            posterior, where the comparison points in a direction but the
            magnitude says the data is thin.
          </Caption>
        </Row>

        <Row
          note={
            <>
              {s6Week === 6 ? (
                <>
                  True rates, revealed only at the end: control{" "}
                  {(TRUE_CONTROL_RATE * 100).toFixed(1)}%, variant{" "}
                  {(TRUE_VARIANT_RATE * 100).toFixed(1)}%.
                </>
              ) : (
                <>
                  Step to week 6 to see the true rates the test was measuring
                  all along.
                </>
              )}
            </>
          }
        >
          <h3 className="mt-10 text-[1.35rem]">{week.narrative.heading}</h3>
          <div className="mt-4 grid items-start gap-x-8 gap-y-5 lg:grid-cols-[1fr_1fr]">
            <div>
              <PosteriorPairFigure
                points={week.points}
                maxDensity={week.maxDensity}
                controlLabel="A"
                variantLabel="B"
                width={400}
                height={210}
              />
            </div>
            <div>
              <p className="text-[0.95rem] leading-relaxed opacity-85">
                {week.narrative.body}
              </p>
              <table className="plate-data mt-4 w-full text-[0.85rem]">
                <tbody>
                  <tr>
                    <td className="py-1">N per variant</td>
                    <td className="py-1 pl-5 text-right">
                      {formatCount(week.nPerVariant)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1">P(B &gt; A)</td>
                    <td className="py-1 pl-5 text-right">
                      {(week.probBBeatsA * 100).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="border-b border-current/25">
                    <td className="py-1">
                      Loss<sub>A</sub> / Loss<sub>B</sub>
                    </td>
                    <td className="py-1 pl-5 text-right">
                      {(week.lossChooseA * 100).toFixed(3)} /{" "}
                      {(week.lossChooseB * 100).toFixed(3)} pp
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Recommendation</td>
                    <td className="py-1.5 pl-5 text-right">
                      {week.call === "Ship B"
                        ? "Ship variant B"
                        : "Hold with control A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Row>

        <Row>
          <Aside title="What this walkthrough shows">
            <p>
              B looked like the clear winner in weeks 1 and 2, then A pulled
              ahead for weeks 3 and 4, then B reclaimed the lead. The true rates
              — {(TRUE_CONTROL_RATE * 100).toFixed(1)}% for the control and{" "}
              {(TRUE_VARIANT_RATE * 100).toFixed(1)}% for the variant — were
              never visible during the test. The early lead for B was variance;
              A had two strong weeks; then the true signal reasserted itself.
            </p>
            <p>
              A pre-set threshold ε would have held the test through those early
              weeks regardless of which loss was lower. That is the full loop:
              prior, posterior update, P(B &gt; A) for direction, expected loss
              for stakes, the threshold and N<sub>min</sub> for noise, and the
              projection for deciding whether to wait. Every piece is the Beta
              distribution from section 1, used again.
            </p>
          </Aside>
        </Row>
      </article>
    </div>
  )
}
