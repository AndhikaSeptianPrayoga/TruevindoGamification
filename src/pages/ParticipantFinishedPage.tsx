import { Crown, Medal, Sparkles, Trophy } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ParticipantStanding } from '@shared/types/game'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { StatCard } from '@/components/common/StatCard'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { formatScore } from '@/utils/score'
import { sound } from '@/utils/sound'

const PODIUM_STYLE = [
  { order: 'order-2', height: 'h-40', ring: 'border-accent/20', glow: 'animate-glow', icon: Crown, label: '1st', badge: 'bg-gradient-to-r from-accent to-signal text-white' },
  { order: 'order-1', height: 'h-32', ring: 'border-slate-300/80', glow: '', icon: Medal, label: '2nd', badge: 'bg-slate-900 text-white' },
  { order: 'order-3', height: 'h-28', ring: 'border-signal/20', glow: '', icon: Medal, label: '3rd', badge: 'bg-signal text-white' },
]

export default function ParticipantFinishedPage() {
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { sessionState, participantId, setSessionState } = useParticipantStore()
  const playedRef = useRef(false)

  useSessionSocket({
    sessionId,
    onState: setSessionState,
  })

  const leaderboard = useMemo<ParticipantStanding[]>(
    () => [...(sessionState?.leaderboard ?? [])].sort((a, b) => a.rank - b.rank),
    [sessionState?.leaderboard],
  )

  const topThree = leaderboard.slice(0, 3)
  const me = useMemo(
    () => leaderboard.find((entry) => entry.id === participantId) ?? null,
    [leaderboard, participantId],
  )
  const isPodium = me ? me.rank <= 3 : false

  useEffect(() => {
    if (playedRef.current) {
      return
    }
    playedRef.current = true
    sound.fanfare()
  }, [])

  const headline = !me
    ? 'That is a wrap. Thanks for playing.'
    : isPodium
      ? `Excellent work. You finished #${me.rank}.`
      : `Nice work. You finished #${me.rank}.`

  return (
    <>
      <Confetti pieces={isPodium ? 120 : 70} />
      <AppShell
        eyebrow="Session Completed"
        title={headline}
        description="Here is the final leaderboard. The closing experience is designed to stay celebratory, polished, and suitable for the main event screen."
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Your Rank" value={me ? `#${me.rank}` : '—'} />
            <StatCard label="Your Score" value={me ? formatScore(me.score) : '—'} />
          </div>
        }
      >
        <div className="space-y-8">
          {topThree.length > 0 ? (
            <section className="panel-elevated p-6">
              <div className="mb-6 flex items-center justify-center gap-2 text-accent">
                <Trophy className="h-5 w-5" />
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">Top 3 Players</p>
              </div>
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                {topThree.map((entry, index) => {
                  const style = PODIUM_STYLE[index]
                  const Icon = style.icon
                  const isMe = entry.id === participantId
                  return (
                    <div
                      key={entry.id}
                      className={`flex w-24 flex-col items-center sm:w-32 ${style.order}`}
                    >
                      <Icon className={`mb-2 h-7 w-7 ${index === 0 ? 'text-accent' : index === 1 ? 'text-slate-600' : 'text-signal'}`} />
                      <p className="mb-2 max-w-full truncate text-center text-sm font-semibold text-slate-950">
                        {entry.displayName}
                        {isMe ? ' (You)' : ''}
                      </p>
                      <div
                        className={`flex ${style.height} w-full animate-rise-in flex-col items-center justify-start rounded-t-2xl border ${style.ring} ${style.glow} bg-gradient-to-b from-white to-slate-50 pt-3 shadow-[0_18px_44px_rgba(15,23,42,0.1)]`}
                      >
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="mt-3 font-display text-lg font-bold text-slate-950">
                          {formatScore(entry.score)}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {me ? (
            <section
              className={`animate-pop-in flex flex-col items-center gap-3 rounded-[32px] border p-6 text-center shadow-panel ${
                isPodium ? 'border-signal/15 bg-white animate-glow' : 'border-slate-200 bg-white/90'
              }`}
            >
              <Sparkles className="h-6 w-6 text-accent" />
              <p className="text-xs uppercase tracking-[0.25em] text-slate-600">Your Final Position</p>
              <p className="font-display text-5xl font-bold text-slate-950">#{me.rank}</p>
              <p className="text-sm text-slate-600">
                {formatScore(me.score)} pts
                {leaderboard.length > 0 ? ` · out of ${leaderboard.length} participants` : ''}
              </p>
            </section>
          ) : null}

          {leaderboard.length > 0 ? (
            <section className="panel-elevated p-6">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-slate-500">Final Standings</p>
              <div className="grid gap-2">
                {leaderboard.map((entry) => {
                  const isMe = entry.id === participantId
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        isMe ? 'border-signal/20 bg-slate-950 text-white' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isMe ? 'bg-white/10 text-white' : 'bg-slate-950 text-white'
                        }`}>
                          {entry.rank}
                        </span>
                        <span className={`text-sm font-medium ${isMe ? 'text-white' : 'text-slate-950'}`}>
                          {entry.displayName}
                          {isMe ? ' (You)' : ''}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${isMe ? 'text-white' : 'text-slate-700'}`}>
                        {formatScore(entry.score)} pts
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          <div className="flex justify-center">
            <Link
              to="/"
              className="brand-button-primary"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </AppShell>
    </>
  )
}
