import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { formatScore } from '@/utils/score'
import { sound } from '@/utils/sound'

export default function ResultPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { latestResult, sessionState, setSessionState } = useParticipantStore()
  const result = latestResult
  const leadingParticipant = sessionState?.leaderboard[0]

  const isUnanswered = !result
  const isCorrect = result?.isCorrect ?? false
  const playedRef = useRef<string | null>(null)

  // Play a correct/wrong cue once per evaluated question.
  useEffect(() => {
    const key = result?.questionId ?? 'unanswered'
    if (playedRef.current === key) {
      return
    }
    playedRef.current = key
    if (isUnanswered) {
      sound.wrong()
    } else if (isCorrect) {
      sound.correct()
    } else {
      sound.wrong()
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
            ? 'Your answer is correct!'
            : 'Not quite right this time.'
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
          className={`animate-pop-in rounded-[32px] border p-8 text-center ${
            isCorrect
              ? 'border-accent/40 bg-accent/10'
              : 'border-highlight/40 bg-highlight/10'
          }`}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
            {isCorrect ? (
              <CheckCircle2 className="h-12 w-12 text-accent" />
            ) : (
              <XCircle className="h-12 w-12 text-highlight" />
            )}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-400">Evaluation Status</p>
          <p className="mt-2 font-display text-3xl font-semibold text-white">
            {isUnanswered ? 'No Answer Submitted' : isCorrect ? 'Correct Answer' : 'Need Improvement'}
          </p>

          <div className="mt-6 grid gap-3 text-left text-sm leading-7 text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Your pick</span>
              <p className="mt-1 text-lg font-semibold text-white">{result?.selectedOption ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Correct answer</span>
              <p className="mt-1 text-lg font-semibold text-white">{result?.correctOption ?? '—'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Points earned</span>
              <p className="mt-1 text-lg font-semibold text-white">
                +{formatScore(result?.scoreAwarded ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Current rank</span>
              <p className="mt-1 text-lg font-semibold text-white">
                #{result?.rankAfterAnswer ?? '—'}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-400">
            Hang tight — waiting for the host to move on to the next question or close the session.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
