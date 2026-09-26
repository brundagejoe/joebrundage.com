import { linePath, makeScale, niceTicks } from "@/shared/lib/plot"

import {
  formatCompactCount,
  formatMde,
  type MdeMode,
  type SampleSizePoint,
} from "./model"

export function SampleSizeCurveFigure({
  points,
  currentMde,
  currentSampleSize,
  mode,
}: {
  points: SampleSizePoint[]
  currentMde: number
  currentSampleSize: number
  mode: MdeMode
}) {
  const width = 600
  const height = 290
  const plotLeft = 62
  const plotRight = width - 16
  const plotTop = 24
  const plotBottom = 226
  const axisY = 240
  const frameX = plotLeft - 14

  const mdes = points.map((point) => point.mdePercent)
  const sizes = points.map((point) => point.sampleSize)
  const mdeLower = mdes[0]
  const mdeUpper = mdes[mdes.length - 1]
  const sizeLower = Math.min(...sizes)
  const sizeUpper = Math.max(...sizes)

  const x = makeScale([mdeLower, mdeUpper], [plotLeft, plotRight])
  const y = makeScale([0, sizeUpper], [plotBottom, plotTop])

  const curve = points.map((point) => ({
    x: x(point.mdePercent),
    y: y(point.sampleSize),
  }))

  const xTicks = niceTicks(mdeLower, mdeUpper, 6)
  const yTicks = niceTicks(sizeLower, sizeUpper, 4).filter(
    (tick) => tick >= sizeLower && tick <= sizeUpper
  )

  const markerX = x(currentMde)
  const markerY = y(currentSampleSize)
  const labelOnLeft = markerX > plotRight - 90

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label="Required sample size per variant as a function of the minimum detectable effect"
    >
      <path
        d={linePath(curve)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        opacity={0.8}
      />

      <line
        x1={markerX}
        x2={markerX}
        y1={markerY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.45}
      />
      <line
        x1={frameX}
        x2={markerX}
        y1={markerY}
        y2={markerY}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.45}
      />
      <circle cx={markerX} cy={markerY} r={3.5} fill="currentColor" />
      <text
        x={labelOnLeft ? markerX - 10 : markerX + 10}
        y={markerY - 10}
        textAnchor={labelOnLeft ? "end" : "start"}
        fontSize={12}
        fill="currentColor"
        opacity={0.75}
      >
        your MDE
      </text>

      <line
        x1={frameX}
        x2={frameX}
        y1={y(sizeLower)}
        y2={y(sizeUpper)}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      <text
        x={frameX - 9}
        y={plotTop - 14}
        fontSize={12}
        fill="currentColor"
        opacity={0.5}
      >
        visitors per variant
      </text>
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={frameX - 5}
            x2={frameX}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={frameX - 9}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {formatCompactCount(tick)}
          </text>
        </g>
      ))}

      <line
        x1={x(mdeLower)}
        x2={x(mdeUpper)}
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
            y={axisY + 20}
            textAnchor="middle"
            fontSize={12}
            fill="currentColor"
            opacity={0.7}
          >
            {formatMde(tick, mode)}
          </text>
        </g>
      ))}
      <text
        x={plotRight}
        y={axisY + 42}
        textAnchor="end"
        fontSize={12}
        fill="currentColor"
        opacity={0.5}
      >
        {mode === "relative"
          ? "minimum detectable effect, relative"
          : "minimum detectable effect, percentage points"}
      </text>
    </svg>
  )
}
