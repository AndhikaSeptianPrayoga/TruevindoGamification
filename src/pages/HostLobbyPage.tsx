import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useHostStore } from '@/stores/useHostStore'
import { createSession, getAdminSessionState, startAdminSession } from '@/utils/api'

export default function HostLobbyPage() {
  const navigate = useNavigate()
  const { sessionId = 'new' } = useParams()
  const [searchParams] = useSearchParams()
  const { activeSession, setActiveSession } = useHostStore()
  const [qrValue, setQrValue] = useState('http://localhost:5173/join/482913')
  const [notice, setNotice] = useState('')
  const [isStarting, setIsStarting] = useState(false)
  const hasBootstrappedNewSession = useRef(false)

  useSessionSocket({
    sessionId: sessionId === 'new' ? activeSession?.sessionId : sessionId,
    role: 'host',
    onState: (state) => {
      setActiveSession(state)
      setQrValue(`${window.location.origin}/join/${state.pinCode}`)
    },
  })

  useEffect(() => {
    async function bootstrapLobby() {
      try {
        if (sessionId === 'new') {
          if (hasBootstrappedNewSession.current) {
            return
          }

          hasBootstrappedNewSession.current = true
          const targetQuizId = searchParams.get('quizId') ?? 'quiz-corporate-values'
          const response = await createSession({ quizId: targetQuizId })
          setActiveSession(response.state)
          setQrValue(response.qrCodeUrl)
          navigate(`/admin/sessions/${response.sessionId}/lobby`, { replace: true })
          return
        }

        const state = await getAdminSessionState(sessionId)
        setActiveSession(state)
        setQrValue(`${window.location.origin}/join/${state.pinCode}`)
      } catch {
        setNotice('The host session could not be loaded yet.')
      }
    }

    void bootstrapLobby()
  }, [navigate, searchParams, sessionId, setActiveSession])

  useEffect(() => {
    if (sessionId !== 'new') {
      hasBootstrappedNewSession.current = false
    }
  }, [sessionId])

  async function handleStartQuiz() {
    const targetSessionId = activeSession?.sessionId ?? sessionId

    try {
      setIsStarting(true)
      const started = await startAdminSession(targetSessionId)
      setActiveSession(started)
      navigate(`/admin/sessions/${started.sessionId}/live`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'The quiz could not be started yet.')
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <AppShell
      eyebrow="Host Lobby"
      title="Host waiting room to get participants ready before the quiz begins."
      description="Use this screen to share the PIN, make sure participants have joined, then start the first question once everyone is ready."
      aside={<AdminSidebar />}
    >
      {notice ? (
        <div className="mb-4 rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200">
          {notice}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Join Access</p>
          <p className="mt-3 font-display text-6xl font-semibold tracking-[0.18em] text-white">
            {activeSession?.pinCode ?? '482913'}
          </p>
          <div className="mt-6 flex justify-center rounded-[28px] border border-white/10 bg-white p-5">
            <QRCodeSVG value={qrValue} size={210} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatCard label="Participants" value={String(activeSession?.joinedParticipants ?? 5)} />
            <StatCard label="Status" value={activeSession?.status ?? 'waiting'} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Joined Participants</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white">
              {activeSession?.quizTitle ?? 'Loading host session...'}
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeSession?.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white"
                >
                  {participant.displayName}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => void handleStartQuiz()}
              disabled={isStarting}
              className="rounded-[24px] bg-white px-4 py-4 text-center text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? 'Starting Quiz...' : 'Start Quiz'}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
