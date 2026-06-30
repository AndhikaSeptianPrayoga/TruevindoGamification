import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { getPlayerState } from '@/utils/api'
import { relativeParticipantLabel } from '@/utils/format'

export default function ParticipantLobbyPage() {
  const navigate = useNavigate()
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { sessionState, setSessionState } = useParticipantStore()

  useSessionSocket({
    sessionId,
    onState: (state) => {
      setSessionState(state)
      if (state.status === 'question_live') {
        navigate(`/play/${sessionId}`)
      }
    },
  })

  useEffect(() => {
    if (!sessionState) {
      getPlayerState(sessionId)
        .then((state) => {
          setSessionState(state)
          if (state.status === 'question_live') {
            navigate(`/play/${sessionId}`)
          }
        })
        .catch(() => navigate('/'))
    }
  }, [navigate, sessionId, sessionState, setSessionState])

  if (!sessionState) {
    return null
  }

  return (
    <AppShell
      eyebrow="Participant Lobby"
      title="Waiting for the host to start the quiz session."
      description="All participants move to the next question at the same time when the host presses start. Your screen always follows the main room."
      aside={
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="PIN" value={sessionState.pinCode} hint="Share with other participants" />
          <StatCard
            label="Participants"
            value={String(sessionState.joinedParticipants)}
            hint={relativeParticipantLabel(sessionState.joinedParticipants)}
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Joined List</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-white">
            {sessionState.quizTitle}
          </h2>
          <div className="mt-6 grid gap-3">
            {sessionState.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/15 px-4 py-3"
              >
                <span className="text-sm font-medium text-white">{participant.displayName}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  {participant.connected ? 'Connected' : 'Reconnecting'}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Sync Status</p>
            <p className="mt-3 font-display text-3xl font-semibold text-white">Waiting Room Active</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              The host will launch the first question once everyone is ready.
            </p>
          </div>
          <Link
            to={`/play/${sessionId}`}
            className="rounded-[32px] border border-accent/40 bg-accent/10 px-6 py-5 text-sm font-semibold text-white transition hover:bg-accent/20"
          >
            Preview the gameplay screen
          </Link>
        </section>
      </div>
    </AppShell>
  )
}
