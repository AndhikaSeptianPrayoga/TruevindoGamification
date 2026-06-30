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
  { order: 'order-2', height: 'h-40', ring: 'border-amber-300/70', glow: 'animate-glow', icon: Crown, label: '1st', badge: 'bg-amber-400 text-ink' },
  { order: 'order-1', height: 'h-32', ring: 'border-slate-300/60', glow: '', icon: Medal, label: '2nd', badge: 'bg-slate-200 text-ink' },
  { order: 'order-3', height: 'h-28', ring: 'border-orange-400/60', glow: '', icon: Medal, label: '3rd', badge: 'bg-orange-400 text-ink' },
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
    ? 'That is a wrap — great game!'
    : isPodium
      ? `Amazing! You finished #${me.rank}! 🎉`
      : `Nice work — you finished #${me.rank}!`

  return (
    <>
      <Confetti pieces={isPodium ? 120 : 70} />
      <AppShell
        eyebrow="Session Completed"
        title={headline}
        description="Here is the final leaderboard. Thanks for playing Truevindo Games!"
        aside={
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Your Rank" value={me ? `#${me.rank}` : '—'} />
            <StatCard label="Your Score" value={me ? formatScore(me.score) : '—'} />
          </div>
        }
      >
        <div className="space-y-8">
          {/* Top 3 podium */}
          {topThree.length > 0 ? (
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
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
                      <Icon className={`mb-2 h-7 w-7 ${index === 0 ? 'text-amber-300' : 'text-slate-300'}`} />
                      <p className="mb-2 max-w-full truncate text-center text-sm font-semibold text-white">
                        {entry.displayName}
                        {isMe ? ' (You)' : ''}
                      </p>
                      <div
                        className={`flex ${style.height} w-full animate-rise-in flex-col items-center justify-start rounded-t-2xl border ${style.ring} ${style.glow} bg-gradient-to-b from-white/15 to-white/5 pt-3`}
                      >
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${style.badge}`}>
                          {style.label}
                        </span>
                        <span className="mt-3 font-display text-lg font-bold text-white">
                          {formatScore(entry.score)}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">pts</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ) : null}

          {/* Participant's own position highlight */}
          {me ? (
            <section
              className={`animate-pop-in flex flex-col items-center gap-3 rounded-[32px] border p-6 text-center ${
                isPodium ? 'border-accent/50 bg-accent/10 animate-glow' : 'border-white/10 bg-white/5'
              }`}
            >
              <Sparkles className="h-6 w-6 text-accent" />
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Your Final Position</p>
              <p className="font-display text-5xl font-bold text-white">#{me.rank}</p>
              <p className="text-sm text-slate-300">
                {formatScore(me.score)} pts
                {leaderboard.length > 0 ? ` · out of ${leaderboard.length} players` : ''}
              </p>
            </section>
          ) : null}

          {/* Full standings */}
          {leaderboard.length > 0 ? (
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-6">
              <p className="mb-4 text-xs uppercase tracking-[0.25em] text-slate-400">Final Standings</p>
              <div className="grid gap-2">
                {leaderboard.map((entry) => {
                  const isMe = entry.id === participantId
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        isMe ? 'border-accent/50 bg-accent/10' : 'border-white/10 bg-black/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
                          {entry.rank}
                        </span>
                        <span className="text-sm font-medium text-white">
                          {entry.displayName}
                          {isMe ? ' (You)' : ''}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-200">
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
              className="rounded-[24px] bg-white px-6 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </AppShell>
    </>
  )
}
