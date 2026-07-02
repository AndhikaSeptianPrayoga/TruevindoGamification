import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { CountdownOverlay } from '@/components/participant/CountdownOverlay'
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

  // Mirror the participants' server-synced 3-2-1 standby on the host screen.
  if (activeSession?.status === 'countdown') {
    return <CountdownOverlay />
  }

  return (
    <AppShell
      eyebrow="Host Live"
      title={question?.text ?? 'The active question will appear here.'}
      description="The live host screen shows the active question, the main timer, and participant response progress before the admin moves to results."
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

          <div className="panel-elevated p-6">
            <p className="kicker">Active Question</p>
            {question?.imageUrl ? (
              <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <img
                  src={question.imageUrl}
                  alt={question.text}
                  className="block h-auto w-full object-contain md:max-h-[460px]"
                />
              </div>
            ) : null}
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {question
                ? Object.entries(question.options).map(([option, text]) => (
                    <div
                      key={option}
                      className="list-item-soft"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{option}</p>
                      <p className="mt-3 text-base leading-7 text-slate-900">{text}</p>
                    </div>
                  ))
                : null}
            </div>
          </div>

          <div className="panel-elevated p-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Question progress</span>
              <span>{countdown.progress}%</span>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-signal"
                style={{ width: `${countdown.progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              {everyoneAnswered
                ? 'Everyone has answered. Move to results to present the summary for this round.'
                : 'Monitor incoming answers and move to results when you are ready to close the round.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleOpenResults()}
            className="brand-button-primary w-full"
          >
            Next: Answer Results
          </button>
        </section>

        <LiveLeaderboard participants={activeSession?.leaderboard ?? []} />
      </div>
    </AppShell>
  )
}
