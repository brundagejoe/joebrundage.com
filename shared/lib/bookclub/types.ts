export type BookclubPhase = "submission" | "voting" | "reading"

export type BookclubSummary = {
  id: string
  name: string
  inviteCode: string
  ownerUserId: string
  phase: BookclubPhase
  currentRound: number
  meetingAt: string | null
  activeBookId: string | null
  isOwner: boolean
}

export type BookclubBook = {
  id: string
  clubId: string
  roundNumber: number
  title: string
  author: string
  lengthHours: number
  createdByUserId: string
  createdAt: string
}

export type BookclubPitch = {
  id: string
  clubId: string
  roundNumber: number
  bookId: string
  userId: string
  pitch: string
  createdAt: string
  updatedAt: string
}

export type BookclubMember = {
  userId: string
  role: "owner" | "member"
  joinedAt: string
}

export type BookclubVoteSummary = {
  bookId: string
  firstChoiceVotes: number
}
