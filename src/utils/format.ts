export function formatRemainingTime(milliseconds: number) {
  if (milliseconds <= 0) {
    return '00:00'
  }

  const totalSeconds = Math.ceil(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function relativeParticipantLabel(totalParticipants: number) {
  if (totalParticipants >= 100) {
    return 'Large-scale event'
  }

  if (totalParticipants >= 50) {
    return 'Mid-scale event'
  }

  return 'Collaborative session'
}
