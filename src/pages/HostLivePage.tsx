import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { LiveLeaderboard } from '@/components/host/LiveLeaderboard'
import { useCountdown } from '@/hooks/useCountdown'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useHostStore } from '@/stores/useHostStore'
import { getAdminSessionState } from '@/utils/api'
import { formatRemainingTime } from '@/utils/format'

export default function HostLivePage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { activeSession, setActiveSession } = useHostStore()
  const { advanceHostStage } = useSessionSocket({
    sessionId: activeSession?.sessionId ?? sessionId,
    role: 'host',
    onState: setActiveSession,
  })

  useEffect(() => {
    if (!activeSession || activeSession.sessionId !== sessionId || activeSession.status === 'waiting') {
      getAdminSessionState(sessionId)
        .then((state) => {
          if (state.status === 'waiting') {
            void advanceHostStage()
            return
          }

          setActiveSession(state)
        })
        .catch(() => undefined)
    }
  }, [activeSession, advanceHostStage, sessionId, setActiveSession])

  const question = activeSession?.activeQuestion
  const countdown = useCountdown(question?.deadlineAt ?? null, question?.durationSeconds ?? 20)
  const totalParticipants = activeSession?.joinedParticipants ?? 0
  const responsesReceived = activeSession?.responsesReceived ?? 0
  const everyoneAnswered = totalParticipants > 0 && responsesReceived >= totalParticipants

  useEffect(() => {
    if (activeSession?.status === 'question_result') {
      navigate(`/admin/sessions/${activeSession.sessionId}/summary`)
    }
  }, [activeSession, navigate])

  async function handleOpenResults() {
    const nextState =
      activeSession?.status === 'question_result' ? activeSession : await advanceHostStage()

    navigate(`/admin/sessions/${nextState.sessionId}/summary`)
  }

  return (
    <AppShell
      eyebrow="Host Live"
      title={question?.text ?? 'The active question will appear here.'}
      description="The live screen shows the active question, the running timer, and how many answers have come in before the admin moves to the results."
      aside={<AdminSidebar />}
    >
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="PIN" value={activeSession?.pinCode ?? '482913'} />
            <StatCard
              label="Question"
              value={question ? `${question.questionNumber}/${question.totalQuestions}` : '-/-'}
            />
            <StatCard
              label="Time"
              value={question ? formatRemainingTime(countdown.remainingMs) : '--:--'}
              hint="server authoritative"
            />
            <StatCard
              label="Responses"
              value={String(activeSession?.responsesReceived ?? 0)}
              hint={`${activeSession?.joinedParticipants ?? 0} active participants`}
            />
          </div>

          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Active Question</p>
            {question?.imageUrl ? (
              <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/15">
                <img
                  src={question.imageUrl}
                  alt={question.text}
                  className="h-72 w-full object-cover"
                />
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {question
                ? Object.entries(question.options).map(([option, text]) => (
                    <div
                      key={option}
                      className="rounded-[28px] border border-white/10 bg-black/15 p-5 text-white"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{option}</p>
                      <p className="mt-3 text-base leading-7">{text}</p>
                    </div>
                  ))
                : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/15 p-5">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Question progress</span>
              <span>{countdown.progress}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-signal"
                style={{ width: `${countdown.progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {everyoneAnswered
                ? 'Everyone has answered. Move to the results to show the summary for this round.'
                : 'Keep an eye on incoming answers. When ready, move to the results for this round.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleOpenResults()}
            className="w-full rounded-[24px] bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100"
          >
            Next: Answer Results
          </button>
        </section>

        <LiveLeaderboard participants={activeSession?.leaderboard ?? []} />
      </div>
    </AppShell>
  )
}
