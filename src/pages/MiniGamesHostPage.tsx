import { Clock, Gamepad2, Lock, LockOpen, MonitorPlay, Trash2, Trophy, Users, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { MiniGamesState } from '@shared/types/minigames'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { MINI_GAME_LIST } from '@/games/minigames'
import { useMiniGamesSocket } from '@/hooks/useMiniGamesSocket'
import { formatRemainingTime } from '@/utils/format'
import { sound } from '@/utils/sound'

function useTicker(intervalMs = 500) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
}

export default function MiniGamesHostPage() {
  const [state, setState] = useState<MiniGamesState | null>(null)
  const [eventNameInput, setEventNameInput] = useState('')
  const [deadlineMinutes, setDeadlineMinutes] = useState('15')
  const [notice, setNotice] = useState('')
  const [presentMode, setPresentMode] = useState(false)
  const clockOffsetRef = useRef(0)
  const nameSyncedRef = useRef(false)
  useTicker(500)

  const { setEventName, setLocked, setDeadline, reset, kick } = useMiniGamesSocket({
    role: 'admin',
    onState: (next) => {
      clockOffsetRef.current = next.serverNow - Date.now()
      setState(next)
      if (!nameSyncedRef.current) {
        nameSyncedRef.current = true
        setEventNameInput(next.eventName)
      }
    },
  })

  const joinUrl = state ? `${window.location.origin}/minigames/${state.eventId}` : ''
  const endsAtLocal = state?.endsAt ? state.endsAt - clockOffsetRef.current : null
  const timeLeftMs = endsAtLocal ? Math.max(0, endsAtLocal - Date.now()) : null
  const leaderboard = state?.leaderboard ?? []
  const podium = leaderboard.slice(0, 3)

  async function handleSetDeadline() {
    const minutes = Number(deadlineMinutes)
    const result = await setDeadline(minutes)
    if (result && 'error' in result) {
      setNotice(result.error)
    } else {
      setNotice('')
    }
  }

  return (
    <>
      <AppShell
        eyebrow="Control Room"
        title="Mini Games"
        description="Players scan the QR code and rotate through five office mini games in random order — every round adds to one combined live leaderboard."
        aside={<AdminSidebar />}
      >
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          {/* Settings + QR */}
          <section className="space-y-4">
            <div className="panel-elevated p-6">
              <p className="kicker">Event Settings</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="mini-event-name" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                    Event Name
                  </label>
                  <input
                    id="mini-event-name"
                    value={eventNameInput}
                    onChange={(event) => setEventNameInput(event.target.value)}
                    onBlur={() => setEventName(eventNameInput)}
                    maxLength={60}
                    className="brand-input"
                  />
                </div>
                <div>
                  <label htmlFor="mini-deadline" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                    Time Limit (minutes)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="mini-deadline"
                      type="number"
                      min={1}
                      max={1440}
                      value={deadlineMinutes}
                      onChange={(event) => setDeadlineMinutes(event.target.value)}
                      className="brand-input"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSetDeadline()}
                      className="brand-button-secondary shrink-0 px-4 text-sm"
                    >
                      Set
                    </button>
                    {state?.endsAt ? (
                      <button
                        type="button"
                        onClick={() => void setDeadline(null)}
                        className="brand-button-ghost shrink-0 px-4 text-sm"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                  {timeLeftMs !== null ? (
                    <p
                      className={`mt-2 flex items-center gap-1.5 text-sm font-bold tabular-nums ${
                        state?.ended ? 'text-red-600' : timeLeftMs < 60_000 ? 'text-red-600' : 'text-slate-700'
                      }`}
                    >
                      <Clock className="h-4 w-4" />
                      {state?.ended ? 'Event ended' : `Ends in ${formatRemainingTime(timeLeftMs)}`}
                    </p>
                  ) : null}
                </div>

                {notice ? <div className="notice-warning rounded-2xl px-4 py-3 text-sm">{notice}</div> : null}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setLocked(!state?.locked)}
                    className="brand-button-secondary flex-1 py-3 text-sm"
                  >
                    {state?.locked ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{state?.locked ? 'Open Registration' : 'Close Registration'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset the event? ALL players and scores are removed.')) {
                        reset()
                      }
                    }}
                    className="brand-button-danger flex-1 py-3 text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Reset Event</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPresentMode(true)
                    sound.unlock()
                    sound.fanfare()
                  }}
                  className="brand-button-primary flex w-full"
                >
                  <MonitorPlay className="h-5 w-5" />
                  <span>Presentation Mode</span>
                </button>
              </div>
            </div>

            <div className="panel-elevated p-6 text-center">
              <p className="kicker">Join by QR</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Players scan this code, enter their name, and start their random game rotation.
              </p>
              <div className="mx-auto mt-4 flex w-fit justify-center rounded-[24px] border border-slate-200 bg-white p-4">
                {joinUrl ? <QRCodeSVG value={joinUrl} size={168} /> : null}
              </div>
              {joinUrl ? <p className="mt-3 break-all text-xs text-slate-500">{joinUrl}</p> : null}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-lg" aria-label="Games in rotation">
                {MINI_GAME_LIST.map((game) => (
                  <span key={game.key} className="pill-tag text-xs">
                    {game.emoji} {game.name}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Stats + leaderboard */}
          <section className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="panel-elevated p-4 text-center">
                <p className="kicker">Players</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 font-display text-3xl font-bold tabular-nums text-slate-950">
                  <Users className="h-5 w-5 text-signal" />
                  {state?.playerCount ?? 0}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  {state?.connectedCount ?? 0} online
                </p>
              </div>
              <div className="panel-elevated p-4 text-center">
                <p className="kicker">Rounds</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 font-display text-3xl font-bold tabular-nums text-slate-950">
                  <Gamepad2 className="h-5 w-5 text-signal" />
                  {state?.totalRounds ?? 0}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">played</p>
              </div>
              <div className="panel-elevated p-4 text-center">
                <p className="kicker">Status</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 font-display text-xl font-bold text-slate-950">
                  <Zap className={`h-5 w-5 ${state?.ended ? 'text-red-500' : 'text-green-500'}`} />
                  {state?.ended ? 'Ended' : state?.locked ? 'Locked' : 'Open'}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">registration</p>
              </div>
            </div>

            <div className="panel-elevated p-6">
              <div className="flex items-center justify-between">
                <p className="kicker">Live Leaderboard</p>
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <ul className="mt-4 grid max-h-[30rem] gap-2 overflow-y-auto pr-1">
                {(() => {
                  const topScore = Math.max(leaderboard[0]?.total ?? 0, 1)
                  return leaderboard.slice(0, 30).map((player) => (
                    <li
                      key={player.id}
                      className={`relative overflow-hidden rounded-[24px] border px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${
                        player.rank === 1
                          ? 'border-amber-300/80 bg-gradient-to-r from-amber-50 to-white'
                          : player.rank === 2
                            ? 'border-slate-300/80 bg-gradient-to-r from-slate-100 to-white'
                            : player.rank === 3
                              ? 'border-orange-300/70 bg-gradient-to-r from-orange-50 to-white'
                              : 'border-slate-200/80 bg-white'
                      }`}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-r-full bg-signal/10 transition-all duration-300"
                        style={{ width: `${Math.min(100, (player.total / topScore) * 100)}%` }}
                        aria-hidden
                      />
                      <div className="relative flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${
                              player.rank === 1
                                ? 'bg-amber-400 text-white shadow-[0_8px_20px_rgba(245,158,11,0.4)]'
                                : player.rank === 2
                                  ? 'bg-slate-400 text-white'
                                  : player.rank === 3
                                    ? 'bg-orange-400 text-white'
                                    : 'bg-slate-950 text-white'
                            }`}
                          >
                            {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-slate-950">{player.name}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {player.division} · {player.rounds} rounds
                              {!player.connected ? ' · offline' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <span className="font-display text-2xl font-bold tabular-nums text-slate-950">
                            {player.total}
                          </span>
                          <button
                            type="button"
                            onClick={() => kick(player.id)}
                            aria-label={`Remove ${player.name} from the event`}
                            className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                })()}
                {leaderboard.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    No players yet — share the QR code to begin!
                  </li>
                ) : null}
              </ul>
            </div>
          </section>
        </div>
      </AppShell>

      {/* Presentation mode — full-screen podium for the projector */}
      {presentMode ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-slate-950 p-6 md:p-10">
          {podium.length > 0 ? <Confetti pieces={140} /> : null}
          <button
            type="button"
            onClick={() => setPresentMode(false)}
            aria-label="Exit presentation mode"
            className="absolute right-5 top-5 rounded-full border border-white/20 p-2.5 text-white transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/60">
              {state?.eventName ?? 'Mini Games'}
            </p>
            <h2 className="mt-3 font-display text-4xl font-black text-white md:text-6xl">🏆 Final Standings</h2>

            {podium.length > 0 ? (
              <div className="mt-10 flex items-end justify-center gap-4 md:gap-8">
                {[podium[1], podium[0], podium[2]].map((player, index) =>
                  player ? (
                    <div key={player.id} className={`flex w-28 flex-col items-center md:w-48 ${index === 1 ? 'order-2' : index === 0 ? 'order-1' : 'order-3'}`}>
                      <p className="mb-1 max-w-full truncate font-display text-lg font-bold text-white md:text-2xl">
                        {player.name}
                      </p>
                      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/50">{player.division}</p>
                      <div
                        className={`animate-rise-in flex w-full flex-col items-center justify-start rounded-t-2xl border bg-gradient-to-b pt-4 ${
                          index === 1
                            ? 'h-44 border-amber-300/60 from-amber-400/30 to-amber-400/5 md:h-56'
                            : index === 0
                              ? 'h-32 border-slate-300/50 from-slate-300/30 to-slate-300/5 md:h-40'
                              : 'h-24 border-orange-400/50 from-orange-400/25 to-orange-400/5 md:h-32'
                        }`}
                      >
                        <span className="text-3xl">{index === 1 ? '🥇' : index === 0 ? '🥈' : '🥉'}</span>
                        <span className="mt-2 font-display text-2xl font-black tabular-nums text-white md:text-4xl">
                          {player.total}
                        </span>
                      </div>
                    </div>
                  ) : null,
                )}
              </div>
            ) : (
              <p className="mt-10 text-white/60">No players yet.</p>
            )}

            {leaderboard.length > 3 ? (
              <div className="mx-auto mt-10 grid max-w-2xl gap-1.5 pb-10 text-left">
                {leaderboard.slice(3, 12).map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5"
                  >
                    <span className="flex items-center gap-3 text-sm font-semibold text-white">
                      <span className="w-6 text-right font-display text-white/50">{player.rank}</span>
                      {player.name}
                      <span className="text-[10px] uppercase tracking-widest text-white/40">{player.division}</span>
                    </span>
                    <span className="font-display text-lg font-bold tabular-nums text-white">{player.total}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
