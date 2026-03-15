export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  if (value < min) {
    return min
  }

  if (value > max) {
    return max
  }

  return value
}

const LANCZOS_COEFFICIENTS = [
  676.5203681218851,
  -1259.1392167224028,
  771.3234287776531,
  -176.6150291621406,
  12.507343278686905,
  -0.13857109526572012,
  9.984369578019572e-6,
  1.5056327351493116e-7,
]

function logGamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z)
  }

  const shifted = z - 1
  let x = 0.9999999999998099

  for (let index = 0; index < LANCZOS_COEFFICIENTS.length; index += 1) {
    x += LANCZOS_COEFFICIENTS[index] / (shifted + index + 1)
  }

  const t = shifted + LANCZOS_COEFFICIENTS.length - 0.5
  return (
    0.9189385332046727 +
    (shifted + 0.5) * Math.log(t) -
    t +
    Math.log(x)
  )
}

export function logBeta(alpha: number, beta: number): number {
  return logGamma(alpha) + logGamma(beta) - logGamma(alpha + beta)
}

export function betaPdf(x: number, alpha: number, beta: number): number {
  const boundedX = clamp(x, 1e-9, 1 - 1e-9)
  return Math.exp(
    (alpha - 1) * Math.log(boundedX) +
      (beta - 1) * Math.log(1 - boundedX) -
      logBeta(alpha, beta)
  )
}

function betaContinuedFraction(x: number, alpha: number, beta: number): number {
  const maxIterations = 200
  const epsilon = 3e-12
  const fpMin = 1e-30

  const qab = alpha + beta
  const qap = alpha + 1
  const qam = alpha - 1
  let c = 1
  let d = 1 - (qab * x) / qap

  if (Math.abs(d) < fpMin) {
    d = fpMin
  }

  d = 1 / d
  let h = d

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m
    let aa = (m * (beta - m) * x) / ((qam + m2) * (alpha + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) {
      d = fpMin
    }
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) {
      c = fpMin
    }
    d = 1 / d
    h *= d * c

    aa = (-(alpha + m) * (qab + m) * x) / ((alpha + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < fpMin) {
      d = fpMin
    }
    c = 1 + aa / c
    if (Math.abs(c) < fpMin) {
      c = fpMin
    }
    d = 1 / d
    const delta = d * c
    h *= delta

    if (Math.abs(delta - 1) < epsilon) {
      break
    }
  }

  return h
}

export function betaCdf(x: number, alpha: number, beta: number): number {
  if (x <= 0) {
    return 0
  }

  if (x >= 1) {
    return 1
  }

  const boundedX = clamp(x, 1e-12, 1 - 1e-12)
  const logFront =
    alpha * Math.log(boundedX) +
    beta * Math.log(1 - boundedX) -
    Math.log(alpha) -
    logBeta(alpha, beta)
  const front = Math.exp(logFront)

  if (boundedX < (alpha + 1) / (alpha + beta + 2)) {
    return front * betaContinuedFraction(boundedX, alpha, beta)
  }

  return 1 - front * betaContinuedFraction(1 - boundedX, beta, alpha)
}

export function betaQuantile(
  probability: number,
  alpha: number,
  beta: number
): number {
  const boundedProbability = clamp(probability, 0, 1)

  if (boundedProbability <= 0) {
    return 0
  }

  if (boundedProbability >= 1) {
    return 1
  }

  let low = 0
  let high = 1

  for (let index = 0; index < 70; index += 1) {
    const mid = (low + high) / 2
    const cdf = betaCdf(mid, alpha, beta)

    if (cdf < boundedProbability) {
      low = mid
    } else {
      high = mid
    }
  }

  return (low + high) / 2
}

export function betaProbabilityBetween(
  lower: number,
  upper: number,
  alpha: number,
  beta: number
): number {
  const boundedLower = clamp(Math.min(lower, upper), 0, 1)
  const boundedUpper = clamp(Math.max(lower, upper), 0, 1)

  if (boundedUpper <= boundedLower) {
    return 0
  }

  return Math.max(0, betaCdf(boundedUpper, alpha, beta) - betaCdf(boundedLower, alpha, beta))
}

export function betaMean(alpha: number, beta: number): number {
  return alpha / (alpha + beta)
}

export function betaMode(alpha: number, beta: number): number | null {
  if (alpha <= 1 || beta <= 1) {
    return null
  }

  return (alpha - 1) / (alpha + beta - 2)
}

export function betaEqualTailInterval(
  alpha: number,
  beta: number,
  credibility = 0.95
): { lower: number; upper: number } {
  const tail = (1 - clamp(credibility, 0, 0.999999)) / 2

  return {
    lower: betaQuantile(tail, alpha, beta),
    upper: betaQuantile(1 - tail, alpha, beta),
  }
}

export function updateBetaPosterior({
  alpha,
  beta,
  successes,
  trials,
}: {
  alpha: number
  beta: number
  successes: number
  trials: number
}) {
  const failures = Math.max(0, trials - successes)

  return {
    alpha: alpha + successes,
    beta: beta + failures,
  }
}
