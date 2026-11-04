import * as React from "react"

import { linePath, makeScale, round } from "@/shared/lib/plot"

import {
  clamp,
  formatCount,
  populationCounts,
  POPULATION,
  type PriorSweepPoint,
  type Result,
} from "./model"

const H_SHADE = 0.8
const NOT_H_SHADE = 0.28
const GHOST_SHADE = 0.07
const LABEL_ROOM = 150

function percentLabel(value: number): string {
  const percent = value * 100
  const digits = percent < 1 ? 2 : 1
  return `${percent.toFixed(digits)}%`
}

function RowTitle({ y, children }: { y: number; children: React.ReactNode }) {
  return (
    <text
      x={0}
      y={y}
      fontSize={11.5}
      letterSpacing="0.12em"
      fill="currentColor"
      opacity={0.55}
      className="uppercase"
    >
      {children}
    </text>
  )
}

function Label({
  x,
  y,
  anchor = "start",
  children,
}: {
  x: number
  y: number
  anchor?: "start" | "middle" | "end"
  children: React.ReactNode
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={13}
      fill="currentColor"
      opacity={0.78}
    >
      {children}
    </text>
  )
}

function Bar({
  x,
  width,
  y,
  height,
  opacity,
}: {
  x: number
  width: number
  y: number
  height: number
  opacity: number
}) {
  if (width <= 0) {
    return null
  }
  return (
    <rect
      x={round(x)}
      y={y}
      width={round(Math.max(width, 1.5))}
      height={height}
      fill="currentColor"
      opacity={opacity}
    />
  )
}

/**
 * Prior, likelihood and posterior as three bars on one width. The top bar
 * splits everyone by H, the middle keeps only the cases that show the
 * evidence, and the bottom stretches those survivors back to full width.
 */
export function FrequencyFigure({
  result,
  width = 640,
}: {
  result: Result
  width?: number
}) {
  const height = 252
  const barHeight = 16
  const x = makeScale([0, 1], [0, width])
  const counts = populationCounts(result)

  const hEdge = x(result.prior)
  const tpEnd = x(result.prior * result.likelihood)
  const fpEnd = hEdge + (x(1) - hEdge) * result.falsePositive
  const posteriorEdge = x(result.posterior)

  const row1 = 42
  const row2 = 122
  const row3 = 202
  const fpLabelFlips = hEdge > width - LABEL_ROOM

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label={`Of ${formatCount(POPULATION)} cases, ${formatCount(counts.truePositives)} true positives and ${formatCount(counts.falsePositives)} false positives; ${percentLabel(result.posterior)} of positives have H.`}
    >
      <path
        d={`M${tpEnd} ${row2 + barHeight} L0 ${row3} L${posteriorEdge} ${row3} Z`}
        fill="currentColor"
        opacity={0.06}
      />
      <path
        d={`M${hEdge} ${row2 + barHeight} L${round(fpEnd)} ${row2 + barHeight} L${width} ${row3} L${posteriorEdge} ${row3} Z`}
        fill="currentColor"
        opacity={0.04}
      />

      <RowTitle y={12}>Everyone · {formatCount(POPULATION)}</RowTitle>
      <Label x={0} y={row1 - 8}>
        {formatCount(result.prior * POPULATION)} with H
      </Label>
      <Label x={width} y={row1 - 8} anchor="end">
        {formatCount((1 - result.prior) * POPULATION)} without
      </Label>
      <Bar x={0} width={hEdge} y={row1} height={barHeight} opacity={H_SHADE} />
      <Bar
        x={hEdge}
        width={width - hEdge}
        y={row1}
        height={barHeight}
        opacity={NOT_H_SHADE}
      />

      <RowTitle y={row2 - 30}>Show the evidence</RowTitle>
      <Label x={0} y={row2 - 8}>
        {formatCount(counts.truePositives)} true positives
      </Label>
      <rect
        x={0}
        y={row2}
        width={width}
        height={barHeight}
        fill="currentColor"
        opacity={GHOST_SHADE}
      />
      <Bar x={0} width={tpEnd} y={row2} height={barHeight} opacity={H_SHADE} />
      <Bar
        x={hEdge}
        width={fpEnd - hEdge}
        y={row2}
        height={barHeight}
        opacity={NOT_H_SHADE}
      />
      <line
        x1={hEdge}
        x2={hEdge}
        y1={row2 - 4}
        y2={row2 + barHeight + 4}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.5}
      />
      <Label
        x={fpLabelFlips ? width : hEdge + 4}
        y={row2 + barHeight + 17}
        anchor={fpLabelFlips ? "end" : "start"}
      >
        {formatCount(counts.falsePositives)} false positives
      </Label>

      <RowTitle y={row3 - 8}>
        Among the {formatCount(counts.positives)} who show it
      </RowTitle>
      <Bar
        x={0}
        width={posteriorEdge}
        y={row3}
        height={barHeight}
        opacity={H_SHADE}
      />
      <Bar
        x={posteriorEdge}
        width={width - posteriorEdge}
        y={row3}
        height={barHeight}
        opacity={NOT_H_SHADE}
      />
      <Label x={0} y={row3 + barHeight + 17}>
        {percentLabel(result.posterior)} have H
      </Label>
      <Label x={width} y={row3 + barHeight + 17} anchor="end">
        {percentLabel(1 - result.posterior)} do not
      </Label>
    </svg>
  )
}

const SWEEP_LOWER = 0.001

function logTickLabel(value: number): string {
  return `${Number((value * 100).toPrecision(1))}%`
}

/**
 * Posterior against prior on a log prior axis, holding both likelihoods
 * fixed. The dashed diagonal is the no-update line where posterior equals
 * prior; the vertical gap at any prior is how far the evidence moves belief.
 */
export function PriorSweepFigure({
  points,
  result,
  width = 640,
}: {
  points: PriorSweepPoint[]
  result: Result
  width?: number
}) {
  const height = 284
  const plotLeft = 44
  const plotRight = width - 6
  const plotTop = 14
  const plotBottom = 232
  const axisY = 242

  const logX = makeScale([Math.log10(SWEEP_LOWER), 0], [plotLeft, plotRight])
  const x = (prior: number) => logX(Math.log10(clamp(prior, SWEEP_LOWER, 1)))
  const y = makeScale([0, 1], [plotBottom, plotTop])

  const curve = points.map((point) => ({
    x: x(point.prior),
    y: y(point.posterior),
  }))
  const diagonal = points.map((point) => ({
    x: x(point.prior),
    y: y(point.prior),
  }))

  const pointX = x(result.prior)
  const afterY = y(result.posterior)
  const beforeY = y(result.prior)
  const labelsLeft = pointX > plotRight - 130
  const labelX = labelsLeft ? pointX - 9 : pointX + 9
  const gap = afterY - beforeY
  const nudge = Math.abs(gap) < 14 ? (14 - Math.abs(gap)) / 2 : 0
  const afterLabelY = afterY + 4 + (gap <= 0 ? -nudge : nudge)
  const beforeLabelY = beforeY + 4 + (gap <= 0 ? nudge : -nudge)

  const widest = points.reduce((best, point) =>
    Math.abs(point.posterior - point.prior) >
    Math.abs(best.posterior - best.prior)
      ? point
      : best
  )
  const candidates = [widest.prior, 0.003, 0.2]
  const seriesAt = candidates
    .map((prior) =>
      points.reduce((best, point) =>
        Math.abs(Math.log10(point.prior) - Math.log10(prior)) <
        Math.abs(Math.log10(best.prior) - Math.log10(prior))
          ? point
          : best
      )
    )
    .find(
      (point) =>
        Math.abs(x(point.prior) - pointX) > 150 &&
        Math.abs(point.posterior - point.prior) > 0.12
    )
  const curveAbove = seriesAt ? seriesAt.posterior > seriesAt.prior : true

  const xTicks = [0.001, 0.01, 0.1, 1]
  const yTicks = [0, 0.5, 1]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label={`Posterior as a function of prior; at the current prior of ${percentLabel(result.prior)} the posterior is ${percentLabel(result.posterior)}.`}
    >
      <line
        x1={plotLeft - 10}
        x2={plotLeft - 10}
        y1={y(0)}
        y2={y(1)}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={plotLeft - 15}
            x2={plotLeft - 10}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={plotLeft - 19}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={13}
            fill="currentColor"
            opacity={0.7}
          >
            {tick * 100}%
          </text>
        </g>
      ))}

      <line
        x1={x(xTicks[0])}
        x2={x(xTicks[xTicks.length - 1])}
        y1={axisY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {xTicks.map((tick) => (
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
            y={axisY + 19}
            textAnchor={
              tick === xTicks[0]
                ? "start"
                : tick === xTicks[xTicks.length - 1]
                  ? "end"
                  : "middle"
            }
            fontSize={13}
            fill="currentColor"
            opacity={0.7}
          >
            {logTickLabel(tick)}
          </text>
        </g>
      ))}
      <text
        x={plotRight}
        y={axisY + 38}
        textAnchor="end"
        fontSize={12}
        fill="currentColor"
        opacity={0.55}
      >
        prior P(H), log scale
      </text>

      <path
        d={linePath(diagonal)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="3 4"
        opacity={0.45}
      />
      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.85}
      />

      {seriesAt ? (
        <>
          <Label
            x={x(seriesAt.prior) + (curveAbove ? -8 : 8)}
            y={y(seriesAt.posterior) + (curveAbove ? -10 : 18)}
            anchor={curveAbove ? "end" : "start"}
          >
            with the evidence
          </Label>
          <Label
            x={x(seriesAt.prior) + (curveAbove ? 8 : -8)}
            y={y(seriesAt.prior) + (curveAbove ? 18 : -10)}
            anchor={curveAbove ? "start" : "end"}
          >
            no update
          </Label>
        </>
      ) : null}

      <line
        x1={pointX}
        x2={pointX}
        y1={beforeY + (gap < 0 ? -3.5 : 3.5)}
        y2={afterY}
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={0.7}
      />
      <circle
        cx={pointX}
        cy={beforeY}
        r={3.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
      />
      <circle cx={pointX} cy={afterY} r={4} fill="currentColor" />
      <Label x={labelX} y={afterLabelY} anchor={labelsLeft ? "end" : "start"}>
        after {percentLabel(result.posterior)}
      </Label>
      <Label x={labelX} y={beforeLabelY} anchor={labelsLeft ? "end" : "start"}>
        before {percentLabel(result.prior)}
      </Label>
    </svg>
  )
}
