import { Crown, Medal, PartyPopper, Trophy } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { useSessionSocket } from '@/hooks/useSessionSocket'
import { useHostStore } from '@/stores/useHostStore'
import { getAdminSessionState } from '@/utils/api'
import { formatScore } from '@/utils/score'
import { sound } from '@/utils/sound'

// Visual config per podium position, ordered so #1 stands tallest in the center.
const PODIUM = [
  {
    place: 2,
    order: 'order-1',
    height: 'h-56 md:h-72',
    medal: 'text-slate-700',
    block: 'from-slate-200 via-white to-white border-slate-300/80',
    badge: 'bg-slate-900 text-white',
    label: '2nd',
  },
  {
    place: 1,
    order: 'order-2',
    height: 'h-72 md:h-96',
    medal: 'text-accent',
    block: 'from-red-50 via-white to-blue-50 border-accent/20',
    badge: 'bg-gradient-to-r from-accent to-signal text-white',
    label: '1st',
  },
  {
    place: 3,
    order: 'order-3',
    height: 'h-48 md:h-60',
    medal: 'text-signal',
    block: 'from-blue-50 via-white to-slate-50 border-signal/20',
    badge: 'bg-signal text-white',
    label: '3rd',
  },
]

export default function HostPodiumPage() {
  const { sessionId = 'session-truevindo-001' } = useParams()
  const { activeSession, setActiveSession } = useHostStore()
  const { updateHostStatus } = useSessionSocket({
    sessionId: activeSession?.sessionId ?? sessionId,
    role: 'host',
    onState: setActiveSession,
  })
  const leaderboard = [...(activeSession?.leaderboard ?? [])].sort((a, b) => a.rank - b.rank)
  const podium = leaderboard.slice(0, 3)
  const playedRef = useRef(false)

  useEffect(() => {
    if (!activeSession || activeSession.sessionId !== sessionId || activeSession.status !== 'completed') {
      getAdminSessionState(sessionId)
        .then((state) => {
          if (state.status === 'completed') {
            setActiveSession(state)
            return
          }

          void updateHostStatus('completed')
        })
        .catch(() => undefined)
    }
  }, [activeSession, sessionId, setActiveSession, updateHostStatus])

  // Celebratory fanfare once the podium is shown on the big screen.
  useEffect(() => {
    if (podium.length > 0 && !playedRef.current) {
      playedRef.current = true
      sound.fanfare()
    }
  }, [podium.length])

  return (
    <>
      {podium.length > 0 ? <Confetti pieces={160} /> : null}
      <AppShell
        eyebrow="Corporate Podium"
        title="The live session winners have been decided."
        description="The final podium is designed to stay celebratory on a large screen while still feeling elegant, professional, and brand-ready for a corporate event."
        aside={<AdminSidebar />}
      >
        <div className="panel-elevated rounded-[40px] bg-gradient-to-br from-red-50/80 via-white to-blue-50/80 p-6 md:p-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 flex items-center justify-center gap-3 text-accent">
              <PartyPopper className="h-7 w-7" />
              <p className="text-xs font-semibold uppercase tracking-[0.45em]">Final Winners</p>
              <PartyPopper className="h-7 w-7 -scale-x-100" />
            </div>
            <h2 className="font-display text-5xl font-bold text-slate-950 md:text-7xl">
              Truevindo Games Podium
            </h2>
          </div>

          {podium.length > 0 ? (
            <div className="mt-12 flex items-end justify-center gap-4 md:gap-8">
              {PODIUM.map((slot) => {
                const entry = podium[slot.place - 1]
                if (!entry) {
                  return null
                }
                const Icon = slot.place === 1 ? Crown : Medal
                return (
                  <div key={slot.place} className={`flex w-32 flex-col items-center md:w-56 ${slot.order}`}>
                    <Icon className={`mb-3 h-10 w-10 md:h-14 md:w-14 ${slot.medal}`} />
                    <p className="mb-1 max-w-full truncate text-center font-display text-xl font-bold text-slate-950 md:text-3xl">
                      {entry.displayName}
                    </p>
                    <p className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-500">
                      {formatScore(entry.score)} pts
                    </p>
                    <div
                      className={`flex ${slot.height} w-full ${slot.place === 1 ? 'animate-glow' : ''} animate-rise-in flex-col items-center justify-start rounded-t-3xl border bg-gradient-to-b ${slot.block} pt-5 shadow-[0_22px_55px_rgba(15,23,42,0.12)]`}
                    >
                      <span className={`rounded-full px-4 py-1.5 text-sm font-bold md:text-lg ${slot.badge}`}>
                        {slot.label}
                      </span>
                      <Trophy className={`mt-4 h-7 w-7 md:h-10 md:w-10 ${slot.medal}`} />
                      <span className="mt-3 font-display text-2xl font-bold text-slate-950 md:text-4xl">
                        #{entry.rank}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-[28px] border border-slate-200 bg-white/80 px-6 py-8 text-center text-sm leading-7 text-slate-600">
              No participants have been recorded for this session yet, so the podium cannot be shown.
            </div>
          )}

          {leaderboard.length > 3 ? (
            <div className="mx-auto mt-12 max-w-3xl">
              <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-slate-500">
                Runners-up
              </p>
              <div className="grid gap-2">
                {leaderboard.slice(3).map((entry) => (
                  <div
                    key={entry.id}
                    className="list-item-soft flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 font-display text-sm font-semibold text-white">
                        {entry.rank}
                      </span>
                      <span className="text-base font-medium text-slate-950">{entry.displayName}</span>
                    </div>
                    <span className="font-display text-lg font-semibold text-slate-950">
                      {formatScore(entry.score)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </AppShell>
    </>
  )
}
