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
          ? 'Waktu untuk pertanyaan ini sudah habis.'
          : isCorrect
            ? 'Jawaban Anda benar.'
            : 'Jawaban Anda belum tepat.'
      }
      description="Saat semua jawaban masuk atau waktu habis, sistem menampilkan status jawaban Anda dan memperbarui posisi leaderboard secara sinkron."
      aside={
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Question Score" value={formatScore(result?.scoreAwarded ?? 0)} />
          <StatCard label="Top Player" value={leadingParticipant?.displayName ?? '—'} />
        </div>
      }
    >
      <div className="mx-auto max-w-2xl">
        <section
          className={`animate-pop-in rounded-[32px] border p-8 text-center shadow-panel ${
            isCorrect
              ? 'border-signal/15 bg-white/88'
              : 'border-accent/15 bg-white/88'
          }`}
        >
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-950">
            {isCorrect ? (
              <CheckCircle2 className="h-12 w-12 text-white" />
            ) : (
              <XCircle className="h-12 w-12 text-white" />
            )}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-slate-500">Evaluation Status</p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-950">
            {isUnanswered ? 'Tidak Ada Jawaban' : isCorrect ? 'Jawaban Benar' : 'Perlu Ditingkatkan'}
          </p>

          <div className="mt-6 grid gap-3 text-left text-sm leading-7 text-slate-600 sm:grid-cols-2">
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Your pick</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">{result?.selectedOption ?? '—'}</p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Correct answer</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">{result?.correctOption ?? '—'}</p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Points earned</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                +{formatScore(result?.scoreAwarded ?? 0)}
              </p>
            </div>
            <div className="list-item-soft">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Current rank</span>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                #{result?.rankAfterAnswer ?? '—'}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Tunggu host memindahkan sesi ke pertanyaan berikutnya atau ke penutupan acara.
          </p>
        </section>
      </div>
    </AppShell>
  )
}
