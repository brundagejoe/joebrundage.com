"use client"

import * as React from "react"

import {
  areaPath,
  linePath,
  makeScale,
  niceTicks,
  round,
  signedPercent,
} from "@/shared/lib/plot"

import type { LiftDensityPoint, PosteriorPoint } from "./model"

export function LiftDistributionFigure({
  points,
  median,
  intervalLower,
  intervalUpper,
  innerLower,
  innerUpper,
  meaningfulLift,
}: {
  points: LiftDensityPoint[]
  median: number
  intervalLower: number
  intervalUpper: number
  innerLower: number
  innerUpper: number
  meaningfulLift: number
}) {
  const width = 720
  const height = 300
  const plotTop = 36
  const plotBottom = 194
  const intervalY = 214
  const axisY = 258

  const lifts = points.map((point) => point.relativeLift)
  const domainLower = Math.min(...lifts, -meaningfulLift * 1.15, intervalLower)
  const domainUpper = Math.max(...lifts, meaningfulLift * 1.15, intervalUpper)
  const x = makeScale([domainLower, domainUpper], [14, width - 14])
  const y = makeScale([0, 1], [plotBottom, plotTop])

  const curve = points.map((point) => ({
    x: x(point.relativeLift),
    y: y(point.density),
  }))
  const harmCurve = curve.filter((_, index) => lifts[index] <= 0)
  if (harmCurve.length > 0) {
    harmCurve.push({ x: x(0), y: plotBottom })
  }

  const ticks = niceTicks(domainLower, domainUpper, 7)
  const curveStart = x(lifts[0])
  const curveEnd = x(lifts[lifts.length - 1])
  const thresholdLabelFits = x(meaningfulLift) - x(0) > 96

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Posterior distribution of variant B's relative lift over variant A"
    >
      <path d={areaPath(curve, plotBottom)} fill="currentColor" opacity={0.1} />
      <path
        d={areaPath(harmCurve, plotBottom)}
        fill="currentColor"
        opacity={0.22}
      />
      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={0.75}
      />

      <line
        x1={x(0)}
        x2={x(0)}
        y1={plotTop - 14}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.6}
      />
      <text
        x={x(0)}
        y={plotTop - 19}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        no difference
      </text>

      {[
        { side: "lower", bound: -meaningfulLift },
        { side: "upper", bound: meaningfulLift },
      ].map(({ side, bound }) => (
        <line
          key={side}
          x1={x(bound)}
          x2={x(bound)}
          y1={plotTop - 14}
          y2={plotBottom}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="2 4"
          opacity={0.45}
        />
      ))}
      {thresholdLabelFits ? (
        <text
          x={x(meaningfulLift)}
          y={plotTop - 19}
          textAnchor="middle"
          fontSize={12}
          fill="currentColor"
          opacity={0.62}
        >
          {signedPercent(meaningfulLift, 0)} meaningful
        </text>
      ) : null}

      <line
        x1={curveStart}
        x2={curveEnd}
        y1={plotBottom}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />

      <line
        x1={x(intervalLower)}
        x2={x(intervalUpper)}
        y1={intervalY}
        y2={intervalY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.75}
      />
      <line
        x1={x(innerLower)}
        x2={x(innerUpper)}
        y1={intervalY}
        y2={intervalY}
        stroke="currentColor"
        strokeWidth={5}
        opacity={0.35}
      />
      <circle cx={x(median)} cy={intervalY} r={3.5} fill="currentColor" />
      <text
        x={x(intervalLower) - 8}
        y={intervalY + 4}
        textAnchor="end"
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        {signedPercent(intervalLower)}
      </text>
      <text
        x={x(intervalUpper) + 8}
        y={intervalY + 4}
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        {signedPercent(intervalUpper)}
      </text>
      <text
        x={x(median)}
        y={intervalY + 20}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.5}
      >
        central 95% of the distribution
      </text>

      <line
        x1={x(ticks[0])}
        x2={x(ticks[ticks.length - 1])}
        y1={axisY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1={axisY}
            y2={axisY + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={x(tick)}
            y={axisY + 20}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {signedPercent(tick, 0)}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function RateDistributionFigure({
  points,
  meanA,
  meanB,
}: {
  points: PosteriorPoint[]
  meanA: number
  meanB: number
}) {
  const width = 420
  const height = 212
  const plotTop = 44
  const plotBottom = 156
  const axisY = 170

  const rates = points.map((point) => point.conversionRatePercent)
  const peak = Math.max(
    ...points.flatMap((point) => [point.variantA, point.variantB]),
    1
  )
  const x = makeScale(
    [Math.min(...rates), Math.max(...rates)],
    [12, width - 12]
  )
  const y = makeScale([0, peak], [plotBottom, plotTop])

  const curveA = points.map((point) => ({
    x: x(point.conversionRatePercent),
    y: y(point.variantA),
  }))
  const curveB = points.map((point) => ({
    x: x(point.conversionRatePercent),
    y: y(point.variantB),
  }))
  const ticks = niceTicks(Math.min(...rates), Math.max(...rates), 5)

  const apexOf = (curve: { x: number; y: number }[]) =>
    curve.reduce((best, point) => (point.y < best.y ? point : best))
  const apexA = apexOf(curveA)
  const apexB = apexOf(curveB)

  /* With equal rates both curves peak at the same place and the two direct
     labels land on top of each other. Stack them over the shared peak
     instead, B nearest the curves since it is the solid one. The trigger is
     the width the labels actually need, not a fixed guess: measured apex
     separations run ~4 units for equal rates and 60+ once they differ. */
  const textA = `A ${(meanA * 100).toFixed(2)}%`
  const textB = `B ${(meanB * 100).toFixed(2)}%`
  const labelSpan = ((textA.length + textB.length) / 2) * 6.4 + 6
  const stacked = Math.abs(apexA.x - apexB.x) < labelSpan
  const sharedX = Math.min(Math.max((apexA.x + apexB.x) / 2, 36), width - 36)

  const label = (
    text: string,
    apex: { x: number; y: number },
    opacity: number,
    stackOffset: number
  ) => (
    <text
      x={stacked ? sharedX : apex.x}
      y={apex.y - 8 - (stacked ? stackOffset : 0)}
      textAnchor="middle"
      fontSize={12}
      fill="currentColor"
      opacity={opacity}
    >
      {text}
    </text>
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Posterior conversion rates for variants A and B"
    >
      <path
        d={areaPath(curveA, plotBottom)}
        fill="currentColor"
        opacity={0.07}
      />
      <path
        d={areaPath(curveB, plotBottom)}
        fill="currentColor"
        opacity={0.07}
      />
      <path
        d={linePath(curveA)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <path
        d={linePath(curveB)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.9}
      />

      {label(textA, apexA, 0.7, 15)}
      {label(textB, apexB, 0.95, 0)}

      <line
        x1={x(ticks[0])}
        x2={x(ticks[ticks.length - 1])}
        y1={axisY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1={axisY}
            y2={axisY + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={x(tick)}
            y={axisY + 20}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {tick.toFixed(1)}%
          </text>
        </g>
      ))}
    </svg>
  )
}

export function RegretDecayFigure({
  points,
}: {
  points: { extraVisitors: number; regret: number }[]
}) {
  const width = 420
  const height = 158
  const plotTop = 28
  const plotBottom = 106
  const axisY = 120

  const maxVisitors = Math.max(...points.map((point) => point.extraVisitors), 1)
  const maxRegret = Math.max(...points.map((point) => point.regret), 1e-9)
  const x = makeScale([0, maxVisitors], [16, width - 52])
  const y = makeScale([0, maxRegret], [plotBottom, plotTop])

  const curve = points.map((point) => ({
    x: x(point.extraVisitors),
    y: y(point.regret),
  }))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Expected regret as a function of additional traffic per variant"
    >
      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={0.8}
      />
      {curve.map((point, index) => (
        <circle
          key={points[index].extraVisitors}
          cx={point.x}
          cy={point.y}
          r={2.5}
          fill="currentColor"
          opacity={0.8}
        />
      ))}

      <text
        x={curve[0].x}
        y={curve[0].y - 11}
        fontSize={12}
        fill="currentColor"
        opacity={0.7}
      >
        {(points[0].regret * 100).toFixed(3)} pp today
      </text>
      <text
        x={curve[curve.length - 1].x + 7}
        y={curve[curve.length - 1].y + 4}
        fontSize={12}
        fill="currentColor"
        opacity={0.7}
      >
        {(points[points.length - 1].regret * 100).toFixed(3)}
      </text>

      <line
        x1={x(0)}
        x2={x(maxVisitors)}
        y1={axisY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {points.map((point) => (
        <g key={point.extraVisitors}>
          <line
            x1={x(point.extraVisitors)}
            x2={x(point.extraVisitors)}
            y1={axisY}
            y2={axisY + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={x(point.extraVisitors)}
            y={axisY + 20}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {point.extraVisitors === 0
              ? "now"
              : `+${point.extraVisitors / 1000}k`}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ProbabilityStaircase({
  rows,
  threshold,
}: {
  rows: { label: string; probability: number; emphasis?: boolean }[]
  threshold: number
}) {
  /* Narrow screens give the statement its own line, with the track and value
     beneath it. Squeezing all three into one row leaves the label a column so
     thin that every word wraps onto its own line. */
  const columns =
    "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(8rem,17rem)_3.75rem] sm:gap-x-4"

  return (
    <div className="mt-6">
      <div
        className={`plate-label grid grid-cols-[1fr_auto] items-end gap-x-4 pb-2 text-[0.66rem] font-medium uppercase tracking-[0.12em] opacity-55 ${columns}`}
      >
        <span>Statement</span>
        <span className="relative hidden h-4 sm:block">
          <span className="absolute bottom-0 left-0">0%</span>
          <span className="absolute right-0 bottom-0">100%</span>
        </span>
        <span className="text-right">Chance</span>
      </div>
      <div className="border-t border-current/20 pt-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`py-2 sm:items-center sm:py-[0.3rem] ${columns}`}
          >
            <span className={row.emphasis ? "" : "opacity-80"}>
              {row.label}
            </span>
            <div className="mt-1.5 flex items-center gap-3 sm:mt-0 sm:contents">
              <span className="relative block h-3 flex-1 sm:flex-none">
                <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-current opacity-15" />
                <span
                  className="absolute top-1/2 block h-px -translate-y-1/2 bg-current opacity-45"
                  style={{ left: 0, width: `${round(row.probability * 100)}%` }}
                />
                <span
                  className="absolute top-0 block h-3 w-px bg-current opacity-30"
                  style={{ left: `${round(threshold * 100)}%` }}
                />
                <span
                  className="absolute top-1/2 block size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
                  style={{
                    left: `${round(row.probability * 100)}%`,
                    opacity: row.emphasis ? 1 : 0.7,
                  }}
                />
              </span>
              <span className="plate-data w-[3rem] shrink-0 text-right text-[0.9rem] sm:w-auto">
                {(row.probability * 100).toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-current/20" />
    </div>
  )
}
