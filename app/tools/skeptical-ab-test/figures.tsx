"use client"

import * as React from "react"
import type { CalibrationResult, SkepticalChartPoint } from "bayes-ab"

import {
  areaPath,
  linePath,
  makeScale,
  niceTicks,
  round,
  signedPercent,
  type Point,
} from "@/shared/lib/plot"

import type { SensitivityRow } from "./model"

const LABEL = { fontSize: 13, fill: "currentColor" } as const

function Axis({
  ticks,
  x,
  y,
}: {
  ticks: number[]
  x: (value: number) => number
  y: number
}) {
  return (
    <>
      <line
        x1={x(ticks[0])}
        x2={x(ticks[ticks.length - 1])}
        y1={y}
        y2={y}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1={y}
            y2={y + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={x(tick)}
            y={y + 20}
            textAnchor="middle"
            {...LABEL}
            opacity={0.7}
          >
            {signedPercent(tick, 0)}
          </text>
        </g>
      ))}
    </>
  )
}

/**
 * Figure 1. The prior, the data on its own, and the posterior, drawn as true
 * densities on one relative-lift axis. The library returns each curve scaled
 * to peak at 1; dividing that back out by its peak restores the real heights,
 * so the posterior is the tallest because it is the most certain of the three.
 */
export function PullFigure({
  points,
  priorSd,
  noise,
  posteriorSd,
  observed,
  median,
  lower,
  upper,
  minEffect,
}: {
  points: SkepticalChartPoint[]
  priorSd: number
  noise: number
  posteriorSd: number
  observed: number
  median: number
  lower: number
  upper: number
  minEffect: number
}) {
  const width = 720
  const height = 312
  const plotTop = 44
  const plotBottom = 206
  const intervalY = 228
  const axisY = 270

  /* Peak density of a normal on the log-lift scale is 1 / (sd·√2π). */
  const peak = (sd: number) => 1 / (sd * Math.sqrt(2 * Math.PI))
  const real = points.map((point) => ({
    lift: point.relativeLift,
    prior: point.prior * peak(priorSd),
    data: point.data * peak(noise),
    posterior: point.posterior * peak(posteriorSd),
  }))

  const lifts = real.map((point) => point.lift)
  const domainLower = Math.min(lifts[0], -minEffect * 1.2, lower)
  const domainUpper = Math.max(lifts[lifts.length - 1], minEffect * 1.2, upper)
  const x = makeScale([domainLower, domainUpper], [14, width - 14])
  const y = makeScale([0, peak(posteriorSd)], [plotBottom, plotTop])

  const curve = (key: "prior" | "data" | "posterior"): Point[] =>
    real.map((point) => ({ x: x(point.lift), y: y(point[key]) }))
  const prior = curve("prior")
  const data = curve("data")
  const posterior = curve("posterior")

  const apex = (points: Point[]) =>
    points.reduce((best, point) => (point.y < best.y ? point : best))
  const posteriorApex = apex(posterior)
  const dataApex = apex(data)

  /* The data curve can run off the right edge when the sample is tiny; the
     window is capped around the posterior. Say where it went instead. */
  const dataOffRight = observed > lifts[lifts.length - 1]
  const dataOffLeft = observed < lifts[0]
  const dataLabelText = `your data ${signedPercent(observed)}`
  const dataLabelClash = Math.abs(dataApex.x - posteriorApex.x) < 110
  const dataLabel = dataOffRight
    ? {
        x: width - 14,
        y: dataApex.y - 8,
        anchor: "end" as const,
        text: `${dataLabelText} →`,
      }
    : dataOffLeft
      ? {
          x: 14,
          y: dataApex.y - 8,
          anchor: "start" as const,
          text: `← ${dataLabelText}`,
        }
      : dataLabelClash
        ? {
            x: Math.min(
              x(Math.exp(Math.log1p(observed) + 1.3 * noise) - 1) + 6,
              width - 14
            ),
            y: y(peak(noise) * Math.exp(-0.5 * 1.3 * 1.3)) - 6,
            anchor: "start" as const,
            text: dataLabelText,
          }
        : {
            x: dataApex.x,
            y: dataApex.y - 8,
            anchor: "middle" as const,
            text: dataLabelText,
          }

  /* The prior is labelled on its left flank, where neither other curve sits
     unless the data point the wrong way, in which case use the right flank. */
  const flankSide = observed >= 0 ? -1 : 1
  const flankLift = Math.exp(flankSide * 1.4 * priorSd) - 1
  const priorLabel = {
    x: x(flankLift) + flankSide * 6,
    y: y(peak(priorSd) * Math.exp(-0.5 * 1.4 * 1.4)) - 4,
    anchor: flankSide < 0 ? ("end" as const) : ("start" as const),
  }

  const ticks = niceTicks(domainLower, domainUpper, 7)
  const bandLabelFits = (bound: number) =>
    Math.abs(x(bound) - posteriorApex.x) > 80 && x(bound) - x(0) > 30

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="The prior, the data and the posterior for the relative lift of B over A"
    >
      <path
        d={areaPath(posterior, plotBottom)}
        fill="currentColor"
        opacity={0.12}
      />
      <path
        d={linePath(prior)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="1.5 3"
        opacity={0.6}
      />
      <path
        d={linePath(data)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="5 3"
        opacity={0.65}
      />
      <path
        d={linePath(posterior)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.9}
      />

      <line
        x1={x(0)}
        x2={x(0)}
        y1={plotTop - 14}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.5}
      />
      {minEffect > 0
        ? [-minEffect, minEffect].map((bound) => (
            <g key={bound}>
              <line
                x1={x(bound)}
                x2={x(bound)}
                y1={plotTop - 14}
                y2={plotBottom}
                stroke="currentColor"
                strokeWidth={1}
                strokeDasharray="2 4"
                opacity={0.4}
              />
              {bound > 0 && bandLabelFits(bound) ? (
                <text
                  x={x(bound)}
                  y={plotTop - 19}
                  textAnchor="middle"
                  {...LABEL}
                  opacity={0.55}
                >
                  ±{(minEffect * 100).toFixed(0)}% band
                </text>
              ) : null}
            </g>
          ))
        : null}

      <text
        x={posteriorApex.x}
        y={posteriorApex.y - 8}
        textAnchor="middle"
        {...LABEL}
        opacity={0.95}
      >
        estimate {signedPercent(median)}
      </text>
      <text
        x={dataLabel.x}
        y={dataLabel.y}
        textAnchor={dataLabel.anchor}
        {...LABEL}
        opacity={0.7}
      >
        {dataLabel.text}
      </text>
      <text
        x={priorLabel.x}
        y={priorLabel.y}
        textAnchor={priorLabel.anchor}
        {...LABEL}
        opacity={0.6}
      >
        prior
      </text>

      <line
        x1={x(lifts[0])}
        x2={x(lifts[lifts.length - 1])}
        y1={plotBottom}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />

      <line
        x1={x(lower)}
        x2={x(upper)}
        y1={intervalY}
        y2={intervalY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.75}
      />
      <circle cx={x(median)} cy={intervalY} r={3.5} fill="currentColor" />
      <text
        x={x(lower) - 8}
        y={intervalY + 4}
        textAnchor="end"
        {...LABEL}
        opacity={0.62}
      >
        {signedPercent(lower)}
      </text>
      <text x={x(upper) + 8} y={intervalY + 4} {...LABEL} opacity={0.62}>
        {signedPercent(upper)}
      </text>

      <Axis ticks={ticks} x={x} y={axisY} />
    </svg>
  )
}

/** How much of the estimate comes from the data, and how much from the prior. */
export function WeightStrip({ dataShare }: { dataShare: number }) {
  const share = round(dataShare * 100)
  return (
    <div className="mt-6 max-w-[35em]">
      <div className="plate-label flex justify-between text-[0.8rem] font-medium uppercase tracking-[0.1em] opacity-70">
        <span>Data {Math.round(dataShare * 100)}%</span>
        <span>Prior {100 - Math.round(dataShare * 100)}%</span>
      </div>
      <div className="relative mt-1.5 h-3">
        <span className="absolute inset-0 block bg-current opacity-10" />
        <span
          className="absolute inset-y-0 left-0 block bg-current opacity-60"
          style={{ width: `${share}%` }}
        />
        <span
          className="absolute -top-1 block h-5 w-px bg-current opacity-40"
          style={{ left: "50%" }}
        />
      </div>
    </div>
  )
}

const STATUS_SHORT: Record<SensitivityRow["status"], string> = {
  ship_b: "ship B",
  keep_a: "keep A",
  continue: "keep running",
  no_meaningful_difference: "no meaningful difference",
}

/** Figure 2. The same data under three priors, small multiples on one shared axis. */
export function SensitivityFigure({
  rows,
  minEffect,
}: {
  rows: SensitivityRow[]
  minEffect: number
}) {
  const width = 720
  const labelWidth = 96
  const decisionWidth = 190
  const rowHeight = 34
  const top = 14
  const axisY = top + rows.length * rowHeight + 6
  const height = axisY + 30

  const domainLower = Math.min(
    ...rows.map((row) => row.lower),
    -minEffect * 1.2,
    -0.01
  )
  const domainUpper = Math.max(
    ...rows.map((row) => row.upper),
    minEffect * 1.2,
    0.01
  )
  const x = makeScale(
    [domainLower, domainUpper],
    [labelWidth + 10, width - decisionWidth]
  )
  const ticks = niceTicks(domainLower, domainUpper, 5)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Estimated lift and 95% interval under three prior spreads"
    >
      <line
        x1={x(0)}
        x2={x(0)}
        y1={top - 6}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.5}
      />
      {minEffect > 0
        ? [-minEffect, minEffect].map((bound) => (
            <line
              key={bound}
              x1={x(bound)}
              x2={x(bound)}
              y1={top - 6}
              y2={axisY}
              stroke="currentColor"
              strokeWidth={1}
              strokeDasharray="2 4"
              opacity={0.4}
            />
          ))
        : null}

      {rows.map((row, index) => {
        const cy = top + index * rowHeight + rowHeight / 2
        const strength = row.current ? 1 : 0.6
        return (
          <g key={row.liftPriorSd}>
            <text x={0} y={cy + 4} {...LABEL} opacity={strength * 0.85}>
              prior ±
              {(row.liftPriorSd * 100).toFixed(
                row.liftPriorSd * 100 < 10 ? 1 : 0
              )}
              %
            </text>
            <line
              x1={x(row.lower)}
              x2={x(row.upper)}
              y1={cy}
              y2={cy}
              stroke="currentColor"
              strokeWidth={row.current ? 1.5 : 1}
              opacity={strength * 0.8}
            />
            <circle
              cx={x(row.median)}
              cy={cy}
              r={row.current ? 3.5 : 3}
              fill="currentColor"
              opacity={strength}
            />
            <text
              x={width - decisionWidth + 16}
              y={cy + 4}
              {...LABEL}
              opacity={strength * 0.85}
            >
              {STATUS_SHORT[row.status]}
            </text>
          </g>
        )
      })}

      <Axis ticks={ticks} x={x} y={axisY} />
    </svg>
  )
}

/**
 * Past tests, sorted by observed lift, each with its own 95% noise interval.
 * The band behind them is ±2 of the suggested spread: where true lifts mostly
 * fall. Intervals much wider than the band are tests too small to say much.
 */
export function PastTestsFigure({
  calibration,
}: {
  calibration: CalibrationResult
}) {
  const tests = [...calibration.perTest].sort(
    (a, b) => a.relativeLift - b.relativeLift
  )
  const width = 720
  const rowHeight = tests.length > 40 ? 6 : tests.length > 20 ? 10 : 16
  const top = 10
  const plotBottom = top + tests.length * rowHeight
  const axisY = plotBottom + 8
  const height = axisY + 30

  const intervals = tests.map((test) => ({
    lower: Math.exp(test.logLift - 1.96 * test.noise) - 1,
    upper: Math.exp(test.logLift + 1.96 * test.noise) - 1,
    lift: test.relativeLift,
  }))
  const spread = calibration.liftPriorSd
  const bandLower = Math.exp(-2 * spread) - 1
  const bandUpper = Math.exp(2 * spread) - 1
  const domainLower = Math.min(...intervals.map((row) => row.lower), bandLower)
  const domainUpper = Math.max(...intervals.map((row) => row.upper), bandUpper)
  const x = makeScale([domainLower, domainUpper], [14, width - 14])
  const ticks = niceTicks(domainLower, domainUpper, 7)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Observed lifts of past tests with their noise intervals"
    >
      <rect
        x={x(bandLower)}
        y={top - 4}
        width={round(x(bandUpper) - x(bandLower))}
        height={plotBottom - top + 8}
        fill="currentColor"
        opacity={0.08}
      />
      <line
        x1={x(0)}
        x2={x(0)}
        y1={top - 4}
        y2={plotBottom + 4}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.5}
      />
      {intervals.map((row, index) => {
        const cy = top + index * rowHeight + rowHeight / 2
        return (
          <g key={index}>
            <line
              x1={x(row.lower)}
              x2={x(row.upper)}
              y1={cy}
              y2={cy}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.45}
            />
            <circle
              cx={x(row.lift)}
              cy={cy}
              r={rowHeight > 8 ? 2.5 : 1.75}
              fill="currentColor"
              opacity={0.85}
            />
          </g>
        )
      })}
      <Axis ticks={ticks} x={x} y={axisY} />
    </svg>
  )
}
