export type BookIdentity = {
  id: string
  title: string
  author: string
  normalizedTitle?: string
  normalizedAuthor?: string
}

function tokenize(value: string): string[] {
  return value
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
}

export function normalizeBookField(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function jaccardSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left))
  const rightTokens = new Set(tokenize(right))

  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 1
  }

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0
  }

  let intersection = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1
    }
  }

  const union = new Set([...leftTokens, ...rightTokens]).size
  return union === 0 ? 0 : intersection / union
}

function prefixBonus(left: string, right: string): number {
  if (!left || !right) {
    return 0
  }

  if (left === right) {
    return 1
  }

  return left.startsWith(right) || right.startsWith(left) ? 0.85 : 0
}

function scoreField(left: string, right: string): number {
  const base = jaccardSimilarity(left, right)
  const bonus = prefixBonus(left, right)
  return Math.max(base, bonus)
}

export function fuzzyBookSimilarity(
  left: { title: string; author: string },
  right: { title: string; author: string }
): number {
  const leftTitle = normalizeBookField(left.title)
  const rightTitle = normalizeBookField(right.title)
  const leftAuthor = normalizeBookField(left.author)
  const rightAuthor = normalizeBookField(right.author)

  const titleScore = scoreField(leftTitle, rightTitle)
  const authorScore = scoreField(leftAuthor, rightAuthor)

  return titleScore * 0.7 + authorScore * 0.3
}

export function findFuzzyDuplicate(
  candidates: BookIdentity[],
  incoming: { title: string; author: string },
  threshold = 0.85
): BookIdentity | null {
  const normalizedTitle = normalizeBookField(incoming.title)
  const normalizedAuthor = normalizeBookField(incoming.author)

  let best: { candidate: BookIdentity; score: number } | null = null

  for (const candidate of candidates) {
    const candidateTitle = candidate.normalizedTitle ?? normalizeBookField(candidate.title)
    const candidateAuthor =
      candidate.normalizedAuthor ?? normalizeBookField(candidate.author)

    if (
      candidateTitle === normalizedTitle &&
      candidateAuthor === normalizedAuthor
    ) {
      return candidate
    }

    const score = fuzzyBookSimilarity(
      { title: candidateTitle, author: candidateAuthor },
      { title: normalizedTitle, author: normalizedAuthor }
    )

    if (!best || score > best.score) {
      best = { candidate, score }
    }
  }

  if (!best || best.score < threshold) {
    return null
  }

  return best.candidate
}
