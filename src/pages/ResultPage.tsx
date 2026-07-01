import { CheckCircle2, Flame, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { useCountUp } from '@/hooks/useCountUp'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { formatScore } from '@/utils/score'
import { sound } from '@/utils/sound'

export default function ResultPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { latestResult, participantId, sessionState, setSessionState } = useParticipantStore()
  const result = latestResult
  const leadingParticipant = sessionState?.leaderboard[0]
  const me = sessionState?.leaderboard.find((participant) => participant.id === participantId)
  const streak = me?.streak ?? 0

  const isUnanswered = !result
  const isCorrect = result?.isCorrect ?? false
  const resultTone = isUnanswered ? 'warning' : isCorrect ? 'success' : 'danger'
  const animatedPoints = useCountUp(isCorrect ? result?.scoreAwarded ?? 0 : 0)
  const playedRef = useRef<string | null>(null)

  // Play a correct/wrong cue (plus a matching haptic) once per evaluated question.
  useEffect(() => {
    const key = result?.questionId ?? 'unanswered'
    if (playedRef.current === key) {
      return
    }
    playedRef.current = key
    if (isCorrect) {
      sound.correct()
      sound.vibrate([0, 35, 45, 35])
    } else {
      sound.wrong()
      sound.vibrate(140)
    }
  }, [isCorrect, isUnanswered, result?.questionId])

  useSessionSocket({
    sessionId,
    onState: (state) => {
      setSessionState(state)
      if (state.status === 'completed') {
        navigate(`/finished/${sessionId}`)
        return
      }

      if (
        state.status === 'question_live' &&
        state.activeQuestion &&
        state.activeQuestion.questionId !== result?.questionId
      ) {
        navigate(`/play/${sessionId}`)
      }
    },
  })

  return (
    <AppShell
      eyebrow="Question Result"
      title={
        isUnanswered
          ? 'Time is up for this question.'
          : isCorrect
            ? 'Your answer is correct.'
            : 'That answer is not correct.'
      }
      description="Once all answers are in or the timer ends, the system shows your answer status and updates your leaderboard position in sync."
      aside={
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Question Score" value={formatScore(result?.scoreAwarded ?? 0)} />
          <StatCard label="Top Player" value={leadingParticipant?.displayName ?? '—'} />
        </div>
      }
    >
      <div className="mx-auto max-w-2xl">
        <section
          className={`animate-pop-in rounded-[32px] p-8 text-center shadow-panel ${
            resultTone === 'success'
              ? 'surface-success'
              : resultTone === 'warning'
                ? 'surface-warning'
                : 'surface-danger'
          }`}
        >
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              resultTone === 'success'
                ? 'bg-green-700'
                : resultTone === 'warning'
                  ? 'bg-amber-600'
                  : 'bg-red-700'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="h-12 w-12 text-white" />
            ) : (
              <XCircle className="h-12 w-12 text-white" />
            )}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-700">Evaluation Status</p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-950">
            {isUnanswered ? 'No Answer Submitted' : isCorrect ? 'Correct Answer' : 'Incorrect Answer'}
          </p>

          {isCorrect ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="font-display text-5xl font-bold tabular-nums text-green-700">
                +{formatScore(animatedPoints)}
              </p>
              {streak >= 2 ? (
                <span className="animate-pop-in inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-semibold text-amber-700">
                  <Flame className="h-4 w-4" />
                  {streak} in a row
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 text-left text-sm leading-7 text-slate-600 sm:grid-cols-2">
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">Your pick</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">{result?.selectedOption ?? '—'}</p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">Correct answer</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">{result?.correctOption ?? '—'}</p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">Points earned</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                +{formatScore(result?.scoreAwarded ?? 0)}
              </p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-600">Current rank</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                #{result?.rankAfterAnswer ?? '—'}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-700">
            Wait for the host to move the session to the next question or to the final wrap-up.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
