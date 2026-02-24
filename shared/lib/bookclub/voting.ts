export type RankedChoiceRound = {
  eliminatedCandidateIds: string[]
  tally: Record<string, number>
  totalActiveBallots: number
}

export type RankedChoiceResult = {
  winnerId: string | null
  rounds: RankedChoiceRound[]
}

export function computeRankedChoiceWinner(
  candidateIds: string[],
  ballots: string[][]
): RankedChoiceResult {
  const active = new Set(candidateIds)
  const rounds: RankedChoiceRound[] = []

  if (active.size === 0) {
    return { winnerId: null, rounds }
  }

  while (active.size > 0) {
    const tally: Record<string, number> = {}
    for (const candidateId of active) {
      tally[candidateId] = 0
    }

    let totalActiveBallots = 0

    for (const ballot of ballots) {
      const topChoice = ballot.find((candidateId) => active.has(candidateId))
      if (!topChoice) {
        continue
      }
      tally[topChoice] += 1
      totalActiveBallots += 1
    }

    if (totalActiveBallots === 0) {
      const fallbackWinner = [...active].sort()[0] ?? null
      rounds.push({
        eliminatedCandidateIds: [],
        tally,
        totalActiveBallots,
      })
      return { winnerId: fallbackWinner, rounds }
    }

    const majorityTarget = totalActiveBallots / 2
    const sortedByVotesDesc = [...active].sort((left, right) => {
      const diff = (tally[right] ?? 0) - (tally[left] ?? 0)
      if (diff !== 0) {
        return diff
      }
      return left.localeCompare(right)
    })

    const leader = sortedByVotesDesc[0]
    if ((tally[leader] ?? 0) > majorityTarget) {
      rounds.push({
        eliminatedCandidateIds: [],
        tally,
        totalActiveBallots,
      })
      return { winnerId: leader, rounds }
    }

    const sortedByVotesAsc = [...active].sort((left, right) => {
      const diff = (tally[left] ?? 0) - (tally[right] ?? 0)
      if (diff !== 0) {
        return diff
      }
      return left.localeCompare(right)
    })

    const lowestVoteCount = tally[sortedByVotesAsc[0]] ?? 0
    const eliminatedCandidateIds = sortedByVotesAsc.filter(
      (candidateId) => (tally[candidateId] ?? 0) === lowestVoteCount
    )

    rounds.push({
      eliminatedCandidateIds,
      tally,
      totalActiveBallots,
    })

    if (eliminatedCandidateIds.length === active.size) {
      const winnerId = sortedByVotesDesc[0] ?? null
      return { winnerId, rounds }
    }

    for (const candidateId of eliminatedCandidateIds) {
      active.delete(candidateId)
    }

    if (active.size === 1) {
      return { winnerId: [...active][0] ?? null, rounds }
    }
  }

  return { winnerId: null, rounds }
}
