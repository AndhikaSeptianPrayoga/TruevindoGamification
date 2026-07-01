import type { ParticipantAnswerResult, SessionState } from '@shared/types/game'
import type { PendingAnswer } from '@/stores/useParticipantStore'

/**
 * Rebuild the participant's per-question result from the authoritative
 * `question:result` broadcast plus the locally recorded answer — without relying
 * on the answer acknowledgement, which can be lost to socket/navigation races.
 * Returns null if there isn't enough information yet (e.g. correct option not
 * revealed, or the participant didn't answer).
 */
export function deriveParticipantResult(
  state: SessionState | null | undefined,
  lastAnswer: PendingAnswer | null,
  participantId: string | null,
): ParticipantAnswerResult | null {
  if (!state || !lastAnswer) {
    return null
  }
  const correct = state.answerDistribution?.find((item) => item.isCorrect)
  if (!correct) {
    return null
  }
  const me = state.leaderboard.find((participant) => participant.id === participantId)
  return {
    questionId: lastAnswer.questionId,
    selectedOption: lastAnswer.selectedOption,
    correctOption: correct.option,
    isCorrect: lastAnswer.selectedOption === correct.option,
    scoreAwarded: Math.max(0, (me?.score ?? lastAnswer.scoreBefore) - lastAnswer.scoreBefore),
    rankAfterAnswer: me?.rank ?? 1,
  }
}
