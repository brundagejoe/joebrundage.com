import * as React from "react"

import { linePath, makeScale, niceTicks, round } from "@/shared/lib/plot"

import {
  compactCurrency,
  formatPercent,
  signedCurrency,
  type LongRun,
  type Result,
} from "./model"

type Anchor = "start" | "middle" | "end"

/** Anchors for two labels at the same height, so the nearer pair splay apart. */
function splay(
  firstX: number,
  secondX: number,
  minGap: number
): [Anchor, Anchor] {
  if (Math.abs(firstX - secondX) >= minGap) {
    return ["middle", "middle"]
  }
  return firstX <= secondX ? ["end", "start"] : ["start", "end"]
}

function nudge(anchor: Anchor, offset: number): number {
  return anchor === "end" ? -offset : anchor === "start" ? offset : 0
}

/**
 * Both outcomes on one value axis, each raised to the height of its
 * probability. The expected value is the point where the two would balance.
 */
export function OutcomeBalanceFigure({
  result,
}: {
  result: Result
}) {
  const width = 720
  const height = 240
  const plotTop = 34
  const axisY = 176
  const left = 60
  const right = width - 60

  const { probability, successOutcome, failureOutcome, expectedValue } = result
  const lower = Math.min(successOutcome, failureOutcome, 0)
  const upper = Math.max(successOutcome, failureOutcome, 0)
  const pad = (upper - lower) * 0.08 || 1
  const x = makeScale([lower - pad, upper + pad], [left, right])
  const y = makeScale([0, 1], [axisY, plotTop])

  const stalks = [
    { key: "if it happens", value: successOutcome, weight: probability },
    { key: "if not", value: failureOutcome, weight: 1 - probability },
  ]
  const [favX, unfavX] = stalks.map((stalk) => x(stalk.value))
  const topAnchors = splay(favX, unfavX, 150)
  const tickAnchors = splay(favX, unfavX, 70)
  const stacked = Math.abs(favX - unfavX) < 1
  const zeroX = x(0)
  const showZero =
    Math.abs(zeroX - favX) > 44 && Math.abs(zeroX - unfavX) > 44

  const evX = x(expectedValue)
  const evAnchor: Anchor =
    evX < left + 70 ? "start" : evX > right - 70 ? "end" : "middle"

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label={`Favorable outcome ${signedCurrency(successOutcome)} at ${formatPercent(probability)}, unfavorable outcome ${signedCurrency(failureOutcome)} at ${formatPercent(1 - probability)}, expected value ${signedCurrency(expectedValue)}`}
    >
      {stalks.map((stalk, index) => {
        const stalkX = x(stalk.value)
        const top = y(stalk.weight)
        const anchor = topAnchors[index]
        const labelY = top - 11 - (stacked && index === 1 ? 16 : 0)
        return (
          <g key={stalk.key}>
            <line
              x1={stalkX}
              x2={stalkX}
              y1={axisY}
              y2={top}
              stroke="currentColor"
              strokeWidth={2}
              opacity={0.85}
            />
            <circle cx={stalkX} cy={top} r={4} fill="currentColor" />
            <text
              x={stalkX + nudge(anchor, 4)}
              y={labelY}
              textAnchor={anchor}
              fontSize={13}
              fill="currentColor"
              opacity={0.75}
            >
              {stalk.key} {formatPercent(stalk.weight)}
            </text>
            <line
              x1={stalkX}
              x2={stalkX}
              y1={axisY}
              y2={axisY + 5}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.35}
            />
            {stacked && index === 1 ? null : (
              <text
                x={stalkX + nudge(tickAnchors[index], 2)}
                y={axisY + 19}
                textAnchor={tickAnchors[index]}
                fontSize={13}
                fill="currentColor"
                opacity={0.7}
              >
                {signedCurrency(stalk.value)}
              </text>
            )}
          </g>
        )
      })}

      <line
        x1={x(lower)}
        x2={x(upper)}
        y1={axisY}
        y2={axisY}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {showZero ? (
        <>
          <line
            x1={zeroX}
            x2={zeroX}
            y1={axisY}
            y2={axisY + 5}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={zeroX}
            y={axisY + 19}
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            opacity={0.5}
          >
            $0
          </text>
        </>
      ) : null}

      <path
        d={`M${evX} ${axisY + 1} L${round(evX + 6)} ${axisY + 11} L${round(evX - 6)} ${axisY + 11} Z`}
        fill="currentColor"
        opacity={0.9}
      />
      <text
        x={evX + nudge(evAnchor, -6)}
        y={axisY + 42}
        textAnchor={evAnchor}
        fontSize={13}
        fill="currentColor"
        opacity={0.85}
      >
        expected value {signedCurrency(expectedValue)}
      </text>
    </svg>
  )
}

function countTick(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

/**
 * Running totals for several simulated runs against the expected total, with a
 * band two standard deviations either side of it.
 */
export function LongRunFigure({ longRun }: { longRun: LongRun }) {
  const width = 720
  const height = 290
  const plotTop = 16
  const plotBottom = 232
  const axisY = plotBottom + 12
  const left = 70
  const right = 600

  const { decisions, runs, expectedTotal, bandHalfWidth } = longRun
  const slope = expectedTotal / decisions
  const bandHalf = (n: number) =>
    decisions > 0 ? bandHalfWidth * Math.sqrt(n / decisions) : 0

  const samples = 80
  const band = Array.from({ length: samples + 1 }, (_, index) => {
    const n = (decisions * index) / samples
    return {
      n,
      upper: slope * n + bandHalf(n),
      lower: slope * n - bandHalf(n),
    }
  })

  const values = [
    0,
    ...band.flatMap((point) => [point.upper, point.lower]),
    ...runs.flat(),
  ]
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const yPad = (yMax - yMin) * 0.04 || 1

  const x = makeScale([0, decisions], [left, right])
  const y = makeScale([yMin - yPad, yMax + yPad], [plotBottom, plotTop])

  const step = Math.max(1, Math.floor(decisions / 400))
  const runPaths = runs.map((totals) =>
    linePath(
      totals
        .filter((_, n) => n % step === 0 || n === decisions)
        .map((total, index, kept) => ({
          x: x(index === kept.length - 1 ? decisions : index * step),
          y: y(total),
        }))
    )
  )

  const bandPath = `${linePath(
    band.map((point) => ({ x: x(point.n), y: y(point.upper) }))
  )} ${band
    .slice()
    .reverse()
    .map((point) => `L${x(point.n)} ${y(point.lower)}`)
    .join(" ")} Z`

  const endExpected = y(expectedTotal)
  const endUpper = y(expectedTotal + bandHalfWidth)
  const endLower = y(expectedTotal - bandHalfWidth)
  const bandLabelsFit = endLower - endExpected >= 16

  const xTicks = niceTicks(0, decisions, 5)
  const yTicks = niceTicks(yMin, yMax, 5)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="plate-chart h-auto w-full overflow-visible"
      role="img"
      aria-label={`Running totals over ${countTick(decisions)} decisions, expected total ${signedCurrency(expectedTotal)}`}
    >
      <path d={bandPath} fill="currentColor" opacity={0.08} />

      <line
        x1={left}
        x2={right}
        y1={y(0)}
        y2={y(0)}
        stroke="currentColor"
        strokeWidth={1}
        strokeDasharray="2 4"
        opacity={0.4}
      />

      {runPaths.map((d, index) => (
        <path
          key={index}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={0.9}
          opacity={0.3}
        />
      ))}

      <line
        x1={x(0)}
        x2={x(decisions)}
        y1={y(0)}
        y2={endExpected}
        stroke="currentColor"
        strokeWidth={1.75}
        opacity={0.9}
      />

      <text
        x={right + 8}
        y={endExpected + 4}
        fontSize={13}
        fill="currentColor"
        opacity={0.85}
      >
        expected {signedCurrency(expectedTotal)}
      </text>
      {bandLabelsFit ? (
        <>
          <text
            x={right + 8}
            y={endUpper + 4}
            fontSize={13}
            fill="currentColor"
            opacity={0.55}
          >
            +2 SD
          </text>
          <text
            x={right + 8}
            y={endLower + 4}
            fontSize={13}
            fill="currentColor"
            opacity={0.55}
          >
            −2 SD
          </text>
        </>
      ) : null}

      <line
        x1={x(0)}
        x2={x(decisions)}
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
            textAnchor="middle"
            fontSize={13}
            fill="currentColor"
            opacity={0.7}
          >
            {countTick(tick)}
          </text>
        </g>
      ))}
      <text
        x={right + 24}
        y={axisY + 19}
        fontSize={13}
        fill="currentColor"
        opacity={0.5}
      >
        decisions
      </text>

      <line
        x1={left - 12}
        x2={left - 12}
        y1={y(yMin)}
        y2={y(yMax)}
        stroke="currentColor"
        strokeWidth={1}
        opacity={0.35}
      />
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={left - 17}
            x2={left - 12}
            y1={y(tick)}
            y2={y(tick)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.35}
          />
          <text
            x={left - 22}
            y={y(tick) + 4}
            textAnchor="end"
            fontSize={13}
            fill="currentColor"
            opacity={0.7}
          >
            {compactCurrency(tick)}
          </text>
        </g>
      ))}
    </svg>
  )
}
