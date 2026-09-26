export type BuiltInExampleKey = "medical" | "spam" | "librarian"
export type ExampleKey = BuiltInExampleKey | "custom"

export type ExampleConfig = {
  key: ExampleKey
  title: string
  description: string
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
  priorLabel: string
  likelihoodLabel: string
  falsePositiveLabel: string
}

export type Inputs = {
  priorPercent: string
  truePositivePercent: string
  falsePositivePercent: string
}

export type Result = {
  prior: number
  likelihood: number
  falsePositive: number
  posterior: number
  evidence: number
}

export type PopulationCounts = {
  truePositives: number
  falseNegatives: number
  falsePositives: number
  trueNegatives: number
  positives: number
}

export type CustomGenerationResponse = {
  title: string
  description: string
  priorLabel: string
  likelihoodLabel: string
  falsePositiveLabel: string
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
}

export const POPULATION = 10000

export const EXAMPLES: ExampleConfig[] = [
  {
    key: "medical",
    title: "Medical screening",
    description:
      "A rare condition with a good test can still produce many false alarms.",
    priorPercent: 1,
    truePositivePercent: 99,
    falsePositivePercent: 5,
    priorLabel: "Chance a randomly selected person truly has the condition.",
    likelihoodLabel:
      "If a person has the condition, chance the test reports positive.",
    falsePositiveLabel:
      "If a person does not have the condition, chance the test still reports positive.",
  },
  {
    key: "spam",
    title: "Email spam word",
    description:
      "A suspicious word appears in most spam, but can still appear in normal mail.",
    priorPercent: 20,
    truePositivePercent: 80,
    falsePositivePercent: 10,
    priorLabel:
      "Chance an incoming message is spam before looking at this word.",
    likelihoodLabel:
      "If the message is spam, chance this suspicious word appears.",
    falsePositiveLabel:
      "If the message is not spam, chance this word still appears.",
  },
  {
    key: "librarian",
    title: "Librarian stereotype",
    description:
      "A quiet, bookish description can feel diagnostic, but base rates still matter.",
    priorPercent: 5,
    truePositivePercent: 70,
    falsePositivePercent: 20,
    priorLabel: "Chance a random person is a librarian before any description.",
    likelihoodLabel:
      "If the person is a librarian, chance they match the description.",
    falsePositiveLabel:
      "If the person is not a librarian, chance they still match the description.",
  },
]

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

export function parsePercentInput(value: string): number | null {
  if (value.trim() === "") {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

/** Drops trailing zeros so 1% reads as 1%, not 1.00%, while 0.5% survives. */
export function formatShortPercent(value: number): string {
  const percent = value * 100
  const digits = percent < 1 ? 2 : percent < 10 ? 1 : 0
  return `${Number(percent.toFixed(digits))}%`
}

export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US")
}

export function inputsFromExample(example: ExampleConfig): Inputs {
  return {
    priorPercent: String(example.priorPercent),
    truePositivePercent: String(example.truePositivePercent),
    falsePositivePercent: String(example.falsePositivePercent),
  }
}

export function calculatePosterior({
  priorPercent,
  truePositivePercent,
  falsePositivePercent,
}: {
  priorPercent: number
  truePositivePercent: number
  falsePositivePercent: number
}): Result {
  const prior = clamp(priorPercent / 100, 0.000001, 0.999999)
  const likelihood = clamp(truePositivePercent / 100, 0.000001, 0.999999)
  const falsePositive = clamp(falsePositivePercent / 100, 0.000001, 0.999999)
  const evidence = prior * likelihood + (1 - prior) * falsePositive
  const posterior = (prior * likelihood) / evidence

  return {
    prior,
    likelihood,
    falsePositive,
    posterior,
    evidence,
  }
}

export type ValidatedInputs =
  { ok: true; result: Result } | { ok: false; error: string }

export function validateInputs(inputs: Inputs): ValidatedInputs {
  const priorPercent = parsePercentInput(inputs.priorPercent)
  const truePositivePercent = parsePercentInput(inputs.truePositivePercent)
  const falsePositivePercent = parsePercentInput(inputs.falsePositivePercent)

  if (
    priorPercent === null ||
    truePositivePercent === null ||
    falsePositivePercent === null
  ) {
    return { ok: false, error: "All fields must be valid numbers." }
  }

  if (
    priorPercent < 0 ||
    priorPercent > 100 ||
    truePositivePercent < 0 ||
    truePositivePercent > 100 ||
    falsePositivePercent < 0 ||
    falsePositivePercent > 100
  ) {
    return { ok: false, error: "All values must stay between 0 and 100." }
  }

  return {
    ok: true,
    result: calculatePosterior({
      priorPercent,
      truePositivePercent,
      falsePositivePercent,
    }),
  }
}

export function populationCounts(result: Result): PopulationCounts {
  const truePositives = result.prior * result.likelihood * POPULATION
  const falseNegatives = result.prior * (1 - result.likelihood) * POPULATION
  const falsePositives = (1 - result.prior) * result.falsePositive * POPULATION
  const trueNegatives =
    (1 - result.prior) * (1 - result.falsePositive) * POPULATION

  return {
    truePositives,
    falseNegatives,
    falsePositives,
    trueNegatives,
    positives: truePositives + falsePositives,
  }
}

export type PriorSweepPoint = { prior: number; posterior: number }

/** Posterior across priors spaced evenly in log10 between the bounds. */
export function sweepPriors(
  likelihood: number,
  falsePositive: number,
  lower = 0.001,
  upper = 1,
  steps = 120
): PriorSweepPoint[] {
  const logLower = Math.log10(lower)
  const logUpper = Math.log10(upper)
  return Array.from({ length: steps + 1 }, (_, index) => {
    const prior = clamp(
      10 ** (logLower + ((logUpper - logLower) * index) / steps),
      0.000001,
      0.999999
    )
    const evidence = prior * likelihood + (1 - prior) * falsePositive
    return { prior, posterior: (prior * likelihood) / evidence }
  })
}

export function customExampleFromResponse(
  data: Partial<CustomGenerationResponse>
): ExampleConfig {
  return {
    key: "custom",
    title: String(data.title ?? "Custom"),
    description: String(data.description ?? "Custom scenario"),
    priorLabel: String(
      data.priorLabel ?? "Prior chance before seeing evidence."
    ),
    likelihoodLabel: String(
      data.likelihoodLabel ?? "If the claim is true, chance the signal appears."
    ),
    falsePositiveLabel: String(
      data.falsePositiveLabel ??
        "If the claim is false, chance the signal still appears."
    ),
    priorPercent: Number(data.priorPercent ?? 10),
    truePositivePercent: Number(data.truePositivePercent ?? 80),
    falsePositivePercent: Number(data.falsePositivePercent ?? 15),
  }
}
