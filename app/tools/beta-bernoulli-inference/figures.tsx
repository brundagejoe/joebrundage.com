"use client"

import * as React from "react"

import { areaPath, linePath, makeScale, niceTicks } from "@/shared/lib/plot"

import type { ChartPoint, Query, SweepPoint } from "./model"

function percent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

function Axis({
  ticks,
  scale,
  y,
  extent,
  format,
}: {
  ticks: number[]
  scale: (value: number) => number
  y: number
  extent: readonly [number, number]
  format: (value: number) => string
}) {
  return (
    <>
      <line
        x1={scale(extent[0])}
        x2={scale(extent[1])}
        y1={y}
        y2={y}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={scale(tick)}
            x2={scale(tick)}
            y1={y}
            y2={y + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={scale(tick)}
            y={y + 19}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {format(tick)}
          </text>
        </g>
      ))}
    </>
  )
}

/**
 * Prior and posterior on one plot, with the hypothesis region shaded and its
 * probability written into the shading. The credible interval sits beneath.
 */
export function PosteriorFigure({
  points,
  query,
  queryProbability,
  posteriorMean,
  intervalLower,
  intervalUpper,
}: {
  points: ChartPoint[]
  query: Query
  queryProbability: number
  posteriorMean: number
  intervalLower: number
  intervalUpper: number
}) {
  const width = 720
  const height = 310
  const plotTop = 40
  const plotBottom = 210
  const intervalY = 234
  const axisY = 268

  /* Trim to where the posterior actually lives; a Beta(34,22) squeezed into a
     full 0–100% frame wastes most of the plot. */
  const peak = Math.max(...points.map((point) => point.posteriorDensity), 1e-9)
  const visible = points.filter(
    (point) =>
      point.posteriorDensity > peak * 0.002 || point.priorDensity > 0.02
  )
  const lowerBound = Math.min(
    ...visible.map((point) => point.probabilityPercent / 100),
    query.targetRate
  )
  const upperBound = Math.max(
    ...visible.map((point) => point.probabilityPercent / 100),
    query.targetRate
  )
  const pad = (upperBound - lowerBound) * 0.04
  const domain = [
    Math.max(0, lowerBound - pad),
    Math.min(1, upperBound + pad),
  ] as const

  const inFrame = points.filter(
    (point) =>
      point.probabilityPercent / 100 >= domain[0] &&
      point.probabilityPercent / 100 <= domain[1]
  )
  const priorPeak = Math.max(
    ...inFrame.map((point) => point.priorDensity),
    1e-9
  )
  const x = makeScale(domain, [14, width - 14])
  const y = makeScale([0, peak * 1.12], [plotBottom, plotTop])
  /* The prior is scaled to its own height: at a flat Beta(1,1) it would
     otherwise be a line on the floor, and its shape is the point. */
  const priorY = makeScale(
    [0, Math.max(priorPeak, peak) * 1.12],
    [plotBottom, plotTop]
  )

  const posterior = inFrame.map((point) => ({
    x: x(point.probabilityPercent / 100),
    y: y(point.posteriorDensity),
  }))
  const prior = inFrame.map((point) => ({
    x: x(point.probabilityPercent / 100),
    y: priorY(point.priorDensity),
  }))
  const shaded = inFrame
    .filter((point) => point.shadedDensity !== null)
    .map((point) => ({
      x: x(point.probabilityPercent / 100),
      y: y(point.shadedDensity as number),
    }))

  const shadedPoints = inFrame.filter((point) => point.shadedDensity !== null)
  const shadedMass = shadedPoints.reduce(
    (total, point) => total + (point.shadedDensity as number),
    0
  )
  const centroidRate =
    shadedMass > 0
      ? shadedPoints.reduce(
          (total, point) =>
            total +
            (point.probabilityPercent / 100) * (point.shadedDensity as number),
          0
        ) / shadedMass
      : query.targetRate
  const centroidDensity =
    shadedPoints.reduce(
      (closest, point) =>
        Math.abs(point.probabilityPercent / 100 - centroidRate) <
        Math.abs(closest.probabilityPercent / 100 - centroidRate)
          ? point
          : closest,
      shadedPoints[0] ?? { probabilityPercent: 0, posteriorDensity: 0 }
    )?.posteriorDensity ?? 0
  const shadedLabel = {
    x: x(centroidRate),
    y: (y(centroidDensity) + plotBottom) / 2 + 4,
  }
  const ticks = niceTicks(domain[0], domain[1], 6)
  const posteriorApex = posterior.reduce((best, point) =>
    point.y < best.y ? point : best
  )
  const priorApex = prior.reduce((best, point) =>
    point.y < best.y ? point : best
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Prior and posterior over the success rate, with the hypothesis region shaded"
    >
      {shaded.length > 0 ? (
        <path
          d={areaPath(shaded, plotBottom)}
          fill="currentColor"
          opacity={0.16}
        />
      ) : null}
      <path
        d={linePath(prior)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="4 4"
        opacity={0.55}
      />
      <path
        d={linePath(posterior)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        opacity={0.95}
      />

      <text
        x={priorApex.x}
        y={priorApex.y - 8}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.6}
      >
        prior
      </text>
      <text
        x={posteriorApex.x}
        y={posteriorApex.y - 9}
        textAnchor="middle"
        fontSize={13}
        fill="currentColor"
        opacity={0.95}
      >
        posterior
      </text>

      {shaded.length > 0 ? (
        <text
          x={shadedLabel.x}
          y={shadedLabel.y}
          textAnchor="middle"
          fontSize={13}
          fill="currentColor"
          opacity={0.85}
        >
          {percent(queryProbability, 1)}
        </text>
      ) : null}

      <line
        x1={x(query.targetRate)}
        x2={x(query.targetRate)}
        y1={plotTop - 14}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.6}
      />
      <text
        x={x(query.targetRate)}
        y={plotTop - 19}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        {query.mode} {percent(query.targetRate, 0)}
      </text>

      <line
        x1={x(domain[0])}
        x2={x(domain[1])}
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
      <circle
        cx={x(posteriorMean)}
        cy={intervalY}
        r={3.5}
        fill="currentColor"
      />
      <text
        x={x(intervalLower) - 8}
        y={intervalY + 4}
        textAnchor="end"
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        {percent(intervalLower, 1)}
      </text>
      <text
        x={x(intervalUpper) + 8}
        y={intervalY + 4}
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        {percent(intervalUpper, 1)}
      </text>
      <text
        x={x(posteriorMean)}
        y={intervalY + 20}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.5}
      >
        central 95%, mean at the dot
      </text>

      <Axis
        ticks={ticks}
        scale={x}
        y={axisY}
        extent={domain}
        format={(value) => percent(value, 0)}
      />
    </svg>
  )
}

/**
 * The hypothesis probability as a function of where the line is drawn, with
 * the chosen target marked. Turns a single answer into its whole curve.
 */
export function ThresholdSweepFigure({
  points,
  targetRate,
  probability,
  mode,
}: {
  points: SweepPoint[]
  targetRate: number
  probability: number
  mode: Query["mode"]
}) {
  const width = 720
  const height = 250
  const plotTop = 26
  const plotBottom = 186
  const gutter = 52

  const peak = Math.max(...points.map((point) => point.probability), 1e-9)
  const ceiling = mode === "around" ? Math.max(peak * 1.12, 0.05) : 1
  const x = makeScale([0, 1], [gutter, width - 16])
  const y = makeScale([0, ceiling], [plotBottom, plotTop])
  const curve = points.map((point) => ({
    x: x(point.targetRate),
    y: y(point.probability),
  }))
  const yTicks = niceTicks(0, ceiling, 4).filter((tick) => tick <= ceiling)

  const dotX = x(targetRate)
  const dotY = y(probability)
  /* Keep the direct label off the curve. It sits above the dot, on whichever
     side the curve runs lower — otherwise a rising curve draws straight
     through it. Edges win over that preference. */
  const labelAbove = dotY - plotTop > 26
  const heightAt = (offset: number) => {
    const at = curve.reduce((closest, point) =>
      Math.abs(point.x - (dotX + offset)) <
      Math.abs(closest.x - (dotX + offset))
        ? point
        : closest
    )
    return at.y
  }
  const labelRight =
    dotX < gutter + 190
      ? true
      : dotX > width - 190
        ? false
        : heightAt(90) >= heightAt(-90)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Hypothesis probability as the target rate varies"
    >
      {/* y axis on the left, so the horizontal leader points at the labels
          that decode it */}
      <line
        x1={gutter}
        x2={gutter}
        y1={y(yTicks[yTicks.length - 1])}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={gutter - 5}
            x2={gutter}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={gutter - 10}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {percent(tick, 0)}
          </text>
        </g>
      ))}

      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        opacity={0.85}
      />

      <line
        x1={dotX}
        x2={dotX}
        y1={dotY}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.5}
      />
      <line
        x1={gutter}
        x2={dotX}
        y1={dotY}
        y2={dotY}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.5}
      />
      <circle cx={dotX} cy={dotY} r={3.5} fill="currentColor" />
      <text
        x={labelRight ? dotX + 10 : dotX - 10}
        y={labelAbove ? dotY - 10 : dotY + 20}
        textAnchor={labelRight ? "start" : "end"}
        fontSize={13}
        fill="currentColor"
        opacity={0.9}
      >
        {percent(probability, 1)} at {percent(targetRate, 0)}
      </text>

      <Axis
        ticks={niceTicks(0, 1, 5)}
        scale={x}
        y={plotBottom}
        extent={[0, 1]}
        format={(value) => percent(value, 0)}
      />
    </svg>
  )
}
