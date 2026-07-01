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
      title="Hasil jawaban ronde ini dan posisi leaderboard terbaru."
      description="Setelah hasil ditampilkan, admin cukup melanjutkan ke pertanyaan berikutnya atau otomatis menuju podium saat semua pertanyaan selesai."
      aside={<AdminSidebar />}
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AnswerDistributionChart data={session?.answerDistribution ?? []} />
        <LiveLeaderboard participants={session?.leaderboard ?? []} />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleNextStage()}
          className="brand-button-primary min-w-64"
        >
          {isLastQuestion ? 'Next: Podium' : 'Next: Following Question'}
        </button>
      </div>
    </AppShell>
  )
}
