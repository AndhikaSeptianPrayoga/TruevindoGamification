export function calculateLeaderboardProgress(rank: number, totalParticipants: number) {
  if (totalParticipants <= 1) {
    return 100
  }

  const progress = ((totalParticipants - rank) / (totalParticipants - 1)) * 100
  return Math.max(4, Math.min(100, Math.round(progress)))
}

export function formatScore(score: number) {
  return new Intl.NumberFormat('id-ID').format(score)
}
