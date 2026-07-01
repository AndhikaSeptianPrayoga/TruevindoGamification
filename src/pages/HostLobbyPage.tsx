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
      title="A polished host waiting room built to prepare participants before the quiz begins."
      description="Share the PIN or QR code, confirm that participants have joined, then start the first question once the room is ready. The flow stays linear to reduce operator error during live events."
      aside={<AdminSidebar />}
    >
      {notice ? (
        <div className="notice-danger mb-4 rounded-[28px] px-5 py-4 text-sm">
          {notice}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="panel-elevated p-6">
          <p className="kicker">Join Access</p>
          <p className="mt-3 font-display text-6xl font-semibold tracking-[0.18em] text-slate-950">
            {activeSession?.pinCode ?? '482913'}
          </p>
          <div className="mt-6 flex justify-center rounded-[28px] border border-slate-200 bg-white p-5">
            <QRCodeSVG value={qrValue} size={210} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatCard label="Participants" value={String(activeSession?.joinedParticipants ?? 5)} />
            <StatCard label="Status" value={activeSession?.status ?? 'waiting'} />
          </div>
        </section>

        <section className="space-y-4">
          <div className="panel-elevated p-6">
            <p className="kicker">Joined Participants</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-slate-950">
              {activeSession?.quizTitle ?? 'Loading host session...'}
            </h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {activeSession?.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="list-item-soft text-sm text-slate-900"
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
              className="brand-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStarting ? 'Starting Quiz...' : 'Start Quiz'}
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
