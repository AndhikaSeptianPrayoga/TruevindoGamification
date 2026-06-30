import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { AnswerDistributionChart } from '@/components/host/AnswerDistributionChart'
import { LiveLeaderboard } from '@/components/host/LiveLeaderboard'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useHostStore } from '@/stores/useHostStore'
import { getAdminSessionState } from '@/utils/api'

export default function HostSummaryPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { activeSession, setActiveSession } = useHostStore()
  const { advanceHostStage } = useSessionSocket({
    sessionId: activeSession?.sessionId ?? sessionId,
    role: 'host',
    onState: setActiveSession,
  })
  const session = activeSession
  const isLastQuestion =
    (session?.currentQuestionIndex ?? 0) >= Math.max((session?.totalQuestions ?? 1) - 1, 0)

  useEffect(() => {
    if (!activeSession || activeSession.sessionId !== sessionId) {
      getAdminSessionState(sessionId)
        .then((state) => {
          if (state.status === 'waiting') {
            navigate(`/admin/sessions/${sessionId}/lobby`, { replace: true })
            return
          }

          if (state.status === 'question_live') {
            navigate(`/admin/sessions/${sessionId}/live`, { replace: true })
            return
          }

          if (state.status === 'completed') {
            navigate(`/admin/sessions/${sessionId}/podium`, { replace: true })
            return
          }

          setActiveSession(state)
        })
        .catch(() => undefined)
    }
  }, [activeSession, navigate, sessionId, setActiveSession])

  async function handleNextStage() {
    const nextState = await advanceHostStage()

    if (nextState.status === 'completed') {
      navigate(`/admin/sessions/${nextState.sessionId}/podium`)
      return
    }

    navigate(`/admin/sessions/${nextState.sessionId}/live`)
  }

  return (
    <AppShell
      eyebrow="Round Summary"
      title="This round's answer results and the latest leaderboard positions."
      description="Once the results are shown, the admin simply moves on to the next question, or jumps straight to the podium when all questions are done."
      aside={<AdminSidebar />}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AnswerDistributionChart data={session?.answerDistribution ?? []} />
        <LiveLeaderboard participants={session?.leaderboard ?? []} />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleNextStage()}
          className="rounded-[24px] bg-white px-4 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100"
        >
          {isLastQuestion ? 'Next: Podium' : 'Next: Following Question'}
        </button>
      </div>
    </AppShell>
  )
}
