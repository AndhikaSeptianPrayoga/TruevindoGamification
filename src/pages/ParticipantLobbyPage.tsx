import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
      title="Waiting room peserta yang rapi, jelas, dan siap lanjut saat host memulai quiz."
      description="Semua peserta berpindah ke pertanyaan berikutnya secara sinkron. Layar Anda selalu mengikuti status utama dari host."
      aside={
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="PIN" value={sessionState.pinCode} hint="Dibagikan ke peserta lain" />
          <StatCard
            label="Participants"
            value={String(sessionState.joinedParticipants)}
            hint={relativeParticipantLabel(sessionState.joinedParticipants)}
          />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel-elevated p-6">
          <p className="kicker">Joined List</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
            {sessionState.quizTitle}
          </h2>
          <div className="mt-6 grid gap-3">
            {sessionState.participants.map((participant) => (
              <div
                key={participant.id}
                className="list-item-soft flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-950">{participant.displayName}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {participant.connected ? 'Connected' : 'Reconnecting'}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-4">
          <div className="panel-elevated p-6">
            <p className="kicker">Sync Status</p>
            <p className="mt-3 font-display text-3xl font-semibold text-slate-950">Waiting Room Active</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Host akan meluncurkan pertanyaan pertama saat semua peserta siap.
            </p>
          </div>
          <div className="panel-dark p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-white/65">Instruksi Peserta</p>
            <p className="mt-3 text-sm leading-7 text-white/85">
              Tetap di halaman ini. Sistem akan memindahkan Anda secara otomatis ke pertanyaan
              berikutnya saat host memulai sesi.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
