export type Point = { x: number; y: number }

export type Scale = (value: number) => number

/**
 * Scales round their output. Rendered coordinates are then identical between
 * the SSR runtime and the browser, which keeps React from reporting a
 * hydration mismatch over last-bit floating-point drift.
 */
export function makeScale(
  domain: readonly [number, number],
  range: readonly [number, number]
): Scale {
  const span = domain[1] - domain[0] || 1
  return (value) =>
    round(range[0] + ((value - domain[0]) / span) * (range[1] - range[0]))
}

export function niceTicks(
  lower: number,
  upper: number,
  target: number
): number[] {
  const span = upper - lower
  if (!Number.isFinite(span) || span <= 0) {
    return [lower]
  }

  const rough = span / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step =
    [1, 2, 2.5, 5, 10].find((multiple) => multiple * magnitude >= rough)! *
    magnitude

  const ticks: number[] = []
  for (
    let tick = Math.ceil(lower / step) * step;
    tick <= upper + step / 1e6;
    tick += step
  ) {
    ticks.push(Math.abs(tick) < step / 1e6 ? 0 : tick)
  }
  return ticks
}

/* Sub-pixel precision buys nothing and makes float drift between the SSR
   runtime and the browser visible in the markup. */
export function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function linePath(points: Point[]): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${round(point.x)} ${round(point.y)}`
    )
    .join(" ")
}

export function areaPath(points: Point[], baseline: number): string {
  if (points.length === 0) {
    return ""
  }

  const last = points[points.length - 1]
  return `${linePath(points)} L${round(last.x)} ${baseline} L${round(points[0].x)} ${baseline} Z`
}

export function signedPercent(value: number, digits = 1): string {
  const points = value * 100
  const sign = points > 0 ? "+" : points < 0 ? "−" : ""
  return `${sign}${Math.abs(points).toFixed(digits)}%`
}
