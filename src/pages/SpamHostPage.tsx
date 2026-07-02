import { ChevronDown, ChevronUp, Keyboard, Play, RotateCcw, Square, Trash2, Trophy, Users, X, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { SpamEndedPayload, SpamGameState } from '@shared/types/spam'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { SpamCountdownOverlay } from '@/components/spam/SpamCountdownOverlay'
import { useSpamSocket } from '@/hooks/useSpamSocket'
import { formatRemainingTime } from '@/utils/format'
import { sound } from '@/utils/sound'

function useTicker(intervalMs = 100) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((value) => value + 1), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
}

export default function SpamHostPage() {
  const [game, setGame] = useState<SpamGameState | null>(null)
  const [ended, setEnded] = useState<SpamEndedPayload | null>(null)
  const [notice, setNotice] = useState('')
  const [titleInput, setTitleInput] = useState('')
  const [durationInput, setDurationInput] = useState('60')
  const [targetsInput, setTargetsInput] = useState('')
  const clockOffsetRef = useRef(0)
  const formSyncedRef = useRef(false)
  // Score-bump + rank-movement tracking for the live leaderboard.
  const prevBoardRef = useRef(new Map<string, { score: number; rank: number }>())
  const [bumps, setBumps] = useState<Set<string>>(new Set())
  const [rankMoves, setRankMoves] = useState<Map<string, 'up' | 'down'>>(new Map())
  useTicker(100)

  useEffect(() => {
    const board = game?.leaderboard ?? []
    const previous = prevBoardRef.current
    const nextBumps = new Set<string>()
    const nextMoves = new Map<string, 'up' | 'down'>()
    for (const player of board) {
      const old = previous.get(player.id)
      if (old && player.score > old.score) {
        nextBumps.add(player.id)
      }
      if (old && player.rank !== old.rank) {
        nextMoves.set(player.id, player.rank < old.rank ? 'up' : 'down')
      }
    }
    prevBoardRef.current = new Map(board.map((p) => [p.id, { score: p.score, rank: p.rank }]))
    if (nextMoves.size) {
      setRankMoves(nextMoves)
    }
    if (nextBumps.size) {
      setBumps(nextBumps)
      const timer = setTimeout(() => setBumps(new Set()), 500)
      return () => clearTimeout(timer)
    }
  }, [game?.leaderboard])

  const { configure, start, stop, resetGame, resetTime, kick } = useSpamSocket({
    role: 'admin',
    onState: (state) => {
      clockOffsetRef.current = state.serverNow - Date.now()
      setGame(state)
      // Mirror server settings into the form once (and never while the admin is typing).
      if (!formSyncedRef.current) {
        formSyncedRef.current = true
        setTitleInput(state.title)
        setDurationInput(String(state.duration))
        setTargetsInput(state.targets.join(', '))
      }
    },
    onEnded: (payload) => {
      setEnded(payload)
      sound.fanfare()
      sound.vibrate([0, 40, 60, 40])
    },
  })

  const status = game?.status ?? 'waiting'
  const isActive = status === 'running' || status === 'starting'
  const joinUrl = game ? `${window.location.origin}/spam/${game.gameId}` : ''
  const syncedNow = Date.now() + clockOffsetRef.current
  const countdownSeconds =
    status === 'starting' && game?.startsAt ? Math.max(0, Math.ceil((game.startsAt - syncedNow) / 1000)) : null
  const remainingSeconds =
    status === 'running' && game?.endsAt
      ? Math.max(0, Math.ceil((game.endsAt - syncedNow) / 1000))
      : game?.duration ?? 60
  const timerTone =
    status === 'running' && remainingSeconds <= 5
      ? 'animate-pulse text-red-600'
      : status === 'running' && remainingSeconds <= 10
        ? 'text-amber-600'
        : 'text-slate-950'

  function pushConfig() {
    void configure({ title: titleInput, duration: Number(durationInput), targets: targetsInput })
  }

  async function handleStart() {
    sound.unlock()
    setEnded(null)
    setNotice('')
    const result = await start({ title: titleInput, duration: Number(durationInput), targets: targetsInput })
    if (result && 'error' in result) {
      setNotice(result.error)
    }
  }

  return (
    <>
      {ended?.winner ? <Confetti pieces={140} /> : null}
      {countdownSeconds !== null ? <SpamCountdownOverlay secondsLeft={countdownSeconds} /> : null}
      <AppShell
        eyebrow="Control Room"
        title="Spamming Games"
        description="Players scan the QR code, then race to type the target word as many times as they can before time runs out. Everything is synchronized by the server clock."
        aside={<AdminSidebar />}
      >
        <div className={`grid gap-6 ${isActive ? '' : 'xl:grid-cols-[0.9fr_1.1fr]'}`}>
          {/* Settings + QR — hidden while a round is underway (projector mode) */}
          {!isActive ? (
            <section className="space-y-4">
              <div className="panel-elevated p-6">
                <p className="kicker">Game Settings</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="spam-title" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                      Title
                    </label>
                    <input
                      id="spam-title"
                      value={titleInput}
                      onChange={(event) => setTitleInput(event.target.value)}
                      onBlur={pushConfig}
                      maxLength={80}
                      className="brand-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="spam-duration" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                      Duration (seconds)
                    </label>
                    <input
                      id="spam-duration"
                      type="number"
                      min={10}
                      max={3600}
                      value={durationInput}
                      onChange={(event) => setDurationInput(event.target.value)}
                      onBlur={pushConfig}
                      className="brand-input"
                    />
                  </div>
                  <div>
                    <label htmlFor="spam-targets" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                      Spam Words
                    </label>
                    <textarea
                      id="spam-targets"
                      value={targetsInput}
                      onChange={(event) => setTargetsInput(event.target.value)}
                      onBlur={pushConfig}
                      rows={2}
                      placeholder="truevindo, gimfly"
                      className="brand-input"
                    />
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Separate multiple words with commas — each player is shown one random word at a
                      time and must type it exactly.
                    </p>
                  </div>
                </div>

                {notice ? (
                  <div className="notice-warning mt-4 rounded-2xl px-4 py-3 text-sm">{notice}</div>
                ) : null}

                <button
                  type="button"
                  onClick={() => void handleStart()}
                  className="brand-button-primary mt-5 flex w-full"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Round</span>
                </button>
              </div>

              <div className="panel-elevated p-6 text-center">
                <p className="kicker">Join by QR</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Players scan this code, enter their name, and appear on the live leaderboard.
                </p>
                <div className="mx-auto mt-4 flex w-fit justify-center rounded-[24px] border border-slate-200 bg-white p-4">
                  {joinUrl ? <QRCodeSVG value={joinUrl} size={168} /> : null}
                </div>
                {joinUrl ? <p className="mt-3 break-all text-xs text-slate-500">{joinUrl}</p> : null}
              </div>
            </section>
          ) : null}

          {/* Timer + leaderboard */}
          <section className="space-y-4">
            <div className="panel-elevated p-6 text-center">
              <p className="kicker">{game?.title ?? 'Spamming Games'}</p>
              <p className={`mt-2 font-display text-7xl font-bold tabular-nums transition-colors md:text-8xl ${timerTone}`}>
                {formatRemainingTime(remainingSeconds * 1000)}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <span className="pill-tag">
                  <Users className="mr-1.5 h-3.5 w-3.5" />
                  {game?.playerCount ?? 0} players · {game?.connectedCount ?? 0} online
                </span>
                <span className="pill-tag">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  {game?.totalHits ?? 0} total hits
                </span>
                <span className="pill-tag">
                  <Keyboard className="mr-1.5 h-3.5 w-3.5" />
                  {game?.targets.join(', ')}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {isActive ? (
                  <button
                    type="button"
                    onClick={() => stop()}
                    className="brand-button-danger px-5 py-3 text-sm"
                  >
                    <Square className="h-4 w-4" />
                    <span>Stop Round</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset the timer? The clock returns to the start — player scores are KEPT.')) {
                      resetTime()
                      setEnded(null)
                    }
                  }}
                  className="brand-button-ghost px-5 py-3 text-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset Timer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset the GAME? All players are removed and must scan the QR again.')) {
                      resetGame()
                      setEnded(null)
                    }
                  }}
                  className="brand-button-ghost px-5 py-3 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Reset Game</span>
                </button>
              </div>
            </div>

            <div className="panel-elevated p-6">
              <div className="flex items-center justify-between">
                <p className="kicker">Live Leaderboard</p>
                <Trophy className="h-4 w-4 text-amber-500" />
              </div>
              <ul className="mt-4 grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
                {(() => {
                  const board = (game?.leaderboard ?? []).slice(0, 30)
                  const topScore = Math.max(board[0]?.score ?? 0, 1)
                  return board.map((player) => {
                    const rowTone =
                      player.rank === 1
                        ? 'border-amber-300/80 bg-gradient-to-r from-amber-50 to-white'
                        : player.rank === 2
                          ? 'border-slate-300/80 bg-gradient-to-r from-slate-100 to-white'
                          : player.rank === 3
                            ? 'border-orange-300/70 bg-gradient-to-r from-orange-50 to-white'
                            : 'border-slate-200/80 bg-white'
                    const move = rankMoves.get(player.id)
                    return (
                      <li
                        key={player.id}
                        className={`relative overflow-hidden rounded-[24px] border px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ${rowTone} ${
                          bumps.has(player.id) ? 'spam-bump' : ''
                        }`}
                      >
                        {/* Score progress bar relative to the leader */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-r-full bg-signal/10 transition-all duration-300"
                          style={{ width: `${Math.min(100, (player.score / topScore) * 100)}%` }}
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
                              {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold text-slate-950">{player.name}</p>
                              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {move === 'up' ? (
                                  <span className="inline-flex items-center text-green-600">
                                    <ChevronUp className="h-3 w-3" /> up
                                  </span>
                                ) : move === 'down' ? (
                                  <span className="inline-flex items-center text-red-500">
                                    <ChevronDown className="h-3 w-3" /> down
                                  </span>
                                ) : null}
                                {!player.connected ? <span>offline</span> : move ? null : <span>#{player.rank}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-display text-2xl font-bold tabular-nums text-slate-950">
                              {player.score}
                            </span>
                            <button
                              type="button"
                              onClick={() => kick(player.id)}
                              aria-label={`Remove ${player.name} from the game`}
                              className="rounded-lg border border-red-200 p-1.5 text-red-600 transition hover:bg-red-50"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })
                })()}
                {(game?.leaderboard.length ?? 0) === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    No players yet — share the QR code to begin!
                  </li>
                ) : null}
              </ul>
            </div>
          </section>
        </div>

        {/* Winner overlay */}
        {ended ? (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="panel-elevated animate-pop-in w-full max-w-xl p-8 text-center">
              <p className="kicker">Time&apos;s Up</p>
              {ended.winner ? (
                <>
                  <p className="mt-3 font-display text-2xl font-semibold text-slate-950">🏆 Winner</p>
                  <p className="font-display text-5xl font-bold text-slate-950">{ended.winner.name}</p>
                  <p className="mt-1 text-sm text-slate-600">with {ended.winner.score} hits</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-600">No players joined this round.</p>
              )}

              {ended.leaderboard.length > 1 ? (
                <div className="mt-6 flex items-end justify-center gap-3">
                  {[ended.leaderboard[1], ended.leaderboard[0], ended.leaderboard[2]].map((player, index) =>
                    player ? (
                      <div key={player.id} className="flex w-24 flex-col items-center">
                        <p className="mb-1 max-w-full truncate text-xs font-semibold text-slate-950">{player.name}</p>
                        <div
                          className={`flex w-full flex-col items-center justify-start rounded-t-xl border bg-gradient-to-b from-slate-100 to-white pt-2 ${
                            index === 1 ? 'h-24 border-amber-300' : index === 0 ? 'h-16 border-slate-300' : 'h-12 border-orange-300'
                          }`}
                        >
                          <span className="font-display text-lg font-bold text-slate-950">{player.score}</span>
                          <span className="text-[10px] uppercase tracking-widest text-slate-500">#{player.rank}</span>
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              ) : null}

              <button type="button" onClick={() => setEnded(null)} className="brand-button-primary mt-8 px-8">
                Close
              </button>
            </div>
          </div>
        ) : null}
      </AppShell>
    </>
  )
}
