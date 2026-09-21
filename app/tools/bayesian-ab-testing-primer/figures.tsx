"use client"

import * as React from "react"

import { areaPath, linePath, makeScale, niceTicks } from "@/shared/lib/plot"

import type {
  AbChartPoint,
  BetaChartPoint,
  LossCurvePoint,
  OverlayChartPoint,
  WeekSummary,
} from "./model"

function percentTick(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`
}

function Axis({
  ticks,
  scale,
  y,
  format,
  extent,
}: {
  ticks: number[]
  scale: (value: number) => number
  y: number
  format: (value: number) => string
  extent?: readonly [number, number]
}) {
  const span = extent ?? [ticks[0], ticks[ticks.length - 1]]
  return (
    <>
      <line
        x1={scale(span[0])}
        x2={scale(span[1])}
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

/** Section 1 — a single Beta density, driven by the alpha/beta sliders. */
export function BetaCurveFigure({
  points,
  alpha,
  beta,
}: {
  points: BetaChartPoint[]
  alpha: number
  beta: number
}) {
  const width = 720
  const height = 260
  const plotTop = 26
  const plotBottom = 196
  const axisY = 214

  const peak = Math.max(...points.map((point) => point.density), 1e-6)
  const x = makeScale([0, 1], [14, width - 14])
  const y = makeScale([0, peak * 1.15], [plotBottom, plotTop])
  const curve = points.map((point) => ({
    x: x(point.probability),
    y: y(point.density),
  }))
  const mean = alpha / (alpha + beta)
  const apex = curve.reduce((best, point) => (point.y < best.y ? point : best))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label={`Beta distribution with alpha ${alpha} and beta ${beta}`}
    >
      <path d={areaPath(curve, plotBottom)} fill="currentColor" opacity={0.1} />
      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        opacity={0.85}
      />

      <line
        x1={x(mean)}
        x2={x(mean)}
        y1={plotTop - 12}
        y2={plotBottom}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.45}
      />
      <text
        x={x(mean)}
        y={plotTop - 17}
        textAnchor="middle"
        fontSize={12}
        fill="currentColor"
        opacity={0.62}
      >
        mean {percentTick(mean)}
      </text>
      <text
        x={apex.x + 10}
        y={Math.max(apex.y - 8, plotTop + 2)}
        fontSize={13}
        fill="currentColor"
        opacity={0.75}
      >
        Beta({alpha.toFixed(1)}, {beta.toFixed(1)})
      </text>

      <Axis
        ticks={niceTicks(0, 1, 5)}
        scale={x}
        y={axisY}
        extent={[0, 1]}
        format={(value) => percentTick(value, 0)}
      />
    </svg>
  )
}

/** Section 2 — the same rate at three sample sizes. Width is the message. */
export function SampleSizeOverlayFigure({
  points,
  maxDensity,
  series,
}: {
  points: OverlayChartPoint[]
  maxDensity: number
  series: { key: "n100" | "n500" | "n2000"; label: string }[]
}) {
  const width = 720
  const height = 250
  const plotTop = 26
  const plotBottom = 190
  const axisY = 206

  const probabilities = points.map((point) => point.probability)
  const x = makeScale(
    [Math.min(...probabilities), Math.max(...probabilities)],
    [14, width - 14]
  )
  const y = makeScale([0, maxDensity || 1], [plotBottom, plotTop])

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Posterior densities at three sample sizes"
    >
      {series.map(({ key, label }, index) => {
        const curve = points.map((point) => ({
          x: x(point.probability),
          y: y(point[key]),
        }))
        const seriesPeak = Math.max(...points.map((point) => point[key]))
        const flankIndex = points.reduce(
          (last, point, i) => (point[key] >= seriesPeak * 0.5 ? i : last),
          0
        )
        const flank = curve[flankIndex]
        return (
          <g key={key}>
            <path
              d={areaPath(curve, plotBottom)}
              fill="currentColor"
              opacity={0.05}
            />
            <path
              d={linePath(curve)}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.9 + index * 0.5}
              opacity={0.45 + index * 0.2}
            />
            <text
              x={flank.x + 6}
              y={flank.y - 3}
              fontSize={12}
              fill="currentColor"
              opacity={0.55 + index * 0.18}
            >
              {label}
            </text>
          </g>
        )
      })}

      <Axis
        ticks={niceTicks(
          Math.min(...probabilities),
          Math.max(...probabilities),
          6
        )}
        scale={x}
        y={axisY}
        extent={[Math.min(...probabilities), Math.max(...probabilities)]}
        format={(value) => percentTick(value)}
      />
    </svg>
  )
}

/** Sections 3, 4 and 6 — two posteriors, with the overlap picked out. */
export function PosteriorPairFigure({
  points,
  maxDensity,
  controlLabel = "A",
  variantLabel = "B",
  height = 250,
  width: widthProp,
  compact = false,
  domain,
}: {
  points: AbChartPoint[]
  maxDensity: number
  controlLabel?: string
  variantLabel?: string
  height?: number
  width?: number
  compact?: boolean
  /** Shared x-domain, so a row of small multiples reads on one scale. */
  domain?: readonly [number, number]
}) {
  const width = widthProp ?? (compact ? 200 : 720)
  const plotTop = compact ? 10 : 26
  const plotBottom = height - (compact ? 22 : 60)
  const axisY = plotBottom + (compact ? 8 : 16)

  const probabilities = points.map((point) => point.probability)
  const extent =
    domain ?? ([Math.min(...probabilities), Math.max(...probabilities)] as const)
  const x = makeScale(extent, [compact ? 4 : 14, width - (compact ? 4 : 14)])
  const y = makeScale([0, maxDensity || 1], [plotBottom, plotTop])

  const control = points.map((point) => ({
    x: x(point.probability),
    y: y(point.control),
  }))
  const variant = points.map((point) => ({
    x: x(point.probability),
    y: y(point.variant),
  }))
  const overlap = points.map((point) => ({
    x: x(point.probability),
    y: y(Math.min(point.control, point.variant)),
  }))

  const apexOf = (curve: { x: number; y: number }[]) =>
    curve.reduce((best, point) => (point.y < best.y ? point : best))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Posterior conversion rates for control and variant"
    >
      <path
        d={areaPath(overlap, plotBottom)}
        fill="currentColor"
        opacity={0.18}
      />
      <path
        d={linePath(control)}
        fill="none"
        stroke="currentColor"
        strokeWidth={compact ? 1 : 1.25}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <path
        d={linePath(variant)}
        fill="none"
        stroke="currentColor"
        strokeWidth={compact ? 1.2 : 1.6}
        opacity={0.95}
      />

      {!compact ? (
        <>
          <text
            x={apexOf(control).x}
            y={apexOf(control).y - 8}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            opacity={0.7}
          >
            {controlLabel}
          </text>
          <text
            x={apexOf(variant).x}
            y={apexOf(variant).y - 8}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            opacity={0.95}
          >
            {variantLabel}
          </text>
          <Axis
            ticks={niceTicks(
              Math.min(...probabilities),
              Math.max(...probabilities),
              5
            )}
            scale={x}
            y={axisY}
            extent={extent}
            format={(value) => percentTick(value)}
          />
        </>
      ) : (
        <line
          x1={x(extent[0])}
          x2={x(extent[1])}
          y1={plotBottom}
          y2={plotBottom}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.3}
        />
      )}
    </svg>
  )
}

/** Section 5 — both losses projected forward against sample size. */
export function LossProjectionFigure({ points }: { points: LossCurvePoint[] }) {
  const width = 720
  const height = 280
  const plotTop = 26
  const plotBottom = 214
  /* The axis sits at loss = 0 so vertical distance reads as magnitude. */
  const axisY = plotBottom

  const ns = points.map((point) => point.n)
  const peak = Math.max(
    ...points.flatMap((point) => [point.lossChooseA, point.lossChooseB]),
    1e-6
  )
  const x = makeScale([Math.min(...ns), Math.max(...ns)], [14, width - 96])
  const y = makeScale([0, peak], [plotBottom, plotTop])

  const hold = points.map((point) => ({
    x: x(point.n),
    y: y(point.lossChooseA),
  }))
  const ship = points.map((point) => ({
    x: x(point.n),
    y: y(point.lossChooseB),
  }))

  const label = (
    curve: { x: number; y: number }[],
    text: string,
    value: number,
    opacity: number
  ) => (
    <text
      x={curve[curve.length - 1].x + 8}
      y={curve[curve.length - 1].y + 4}
      fontSize={12}
      fill="currentColor"
      opacity={opacity}
    >
      {text} {value.toFixed(3)}
    </text>
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Expected loss projected against sample size"
    >
      <path
        d={linePath(hold)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeDasharray="4 3"
        opacity={0.7}
      />
      <path
        d={linePath(ship)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        opacity={0.95}
      />
      {label(hold, "hold A", points[points.length - 1].lossChooseA, 0.7)}
      {label(ship, "ship B", points[points.length - 1].lossChooseB, 0.95)}

      <text
        x={14}
        y={plotTop - 10}
        fontSize={12}
        fill="currentColor"
        opacity={0.55}
      >
        expected loss, percentage points
      </text>

      <Axis
        ticks={niceTicks(Math.min(...ns), Math.max(...ns), 5)}
        scale={x}
        y={axisY}
        extent={[Math.min(...ns), Math.max(...ns)]}
        format={(value) => Math.round(value).toLocaleString("en-US")}
      />
    </svg>
  )
}

/** Section 6 — the whole run at once, doubling as the week selector. */
export function WeekSmallMultiples({
  weeks,
  selected,
  onSelect,
}: {
  weeks: WeekSummary[]
  selected: number
  onSelect: (week: number) => void
}) {
  const domain = [
    Math.min(...weeks.flatMap((w) => w.points.map((p) => p.probability))),
    Math.max(...weeks.flatMap((w) => w.points.map((p) => p.probability))),
  ] as const
  const densityMax = Math.max(...weeks.map((w) => w.maxDensity))

  return (
    <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-6">
      {weeks.map((week) => {
        const isSelected = week.week === selected
        return (
          <button
            key={week.week}
            type="button"
            onClick={() => onSelect(week.week)}
            aria-pressed={isSelected}
            className={
              "group border-t pt-2 text-left transition-opacity " +
              (isSelected
                ? "border-current/70 opacity-100"
                : "border-current/20 opacity-55 hover:opacity-85")
            }
          >
            <span className="plate-label block text-[0.62rem] font-medium uppercase tracking-[0.1em]">
              Wk {week.week}
            </span>
            <PosteriorPairFigure
              points={week.points}
              maxDensity={densityMax}
              domain={domain}
              height={74}
              compact
            />
            <span className="plate-data mt-1 block text-[0.72rem]">
              {week.call}
            </span>
          </button>
        )
      })}
    </div>
  )
}
