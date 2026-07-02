import { ArrowRight, Clock, Gamepad2, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { MiniGameKey, MiniGamesState } from '@shared/types/minigames'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { MINI_GAMES, pickNextGame } from '@/games/minigames'
import { createGameRuntime, type GameRuntime } from '@/games/minigames/engine'
import { gameSfx } from '@/games/minigames/sfx'
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

type Overlay =
  | { kind: 'start'; gameKey: MiniGameKey; round: number }
  | { kind: 'result'; score: number; nextKey: MiniGameKey; emoji: string }
  | { kind: 'timeup' }

export default function MiniGamesPlayPage() {
  const { eventId = '' } = useParams()
  const [state, setState] = useState<MiniGamesState | null>(null)
  const [loadError, setLoadError] = useState('')
  const [phase, setPhase] = useState<'join' | 'playing' | 'leaderboard'>('join')
  const [nameInput, setNameInput] = useState('')
  const [divisionInput, setDivisionInput] = useState('')
  const [joinNotice, setJoinNotice] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [total, setTotal] = useState(0)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [round, setRound] = useState(0)
  const [gameScore, setGameScore] = useState(0)
  const [currentKey, setCurrentKey] = useState<MiniGameKey | null>(null)
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [playedTypes, setPlayedTypes] = useState<Set<MiniGameKey>>(new Set())
  const [totalPopped, setTotalPopped] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<GameRuntime | null>(null)
  const clockOffsetRef = useRef(0)
  const timeUpRef = useRef(false)
  useTicker(500)

  const { join, submitScore, finish } = useMiniGamesSocket({
    eventId,
    role: 'player',
    onState: (next) => {
      clockOffsetRef.current = next.serverNow - Date.now()
      setState(next)
    },
    onReset: () => {
      // The host wiped the event — everyone re-registers.
      runtimeRef.current?.destroy()
      runtimeRef.current = null
      timeUpRef.current = false
      setPhase('join')
      setOverlay(null)
      setTotal(0)
      setRound(0)
      setPlayedTypes(new Set())
      setJoinNotice('The host reset the event — please join again.')
    },
    onKicked: (kickedId) => {
      if (kickedId === playerIdRef.current) {
        runtimeRef.current?.destroy()
        runtimeRef.current = null
        setPhase('join')
        setOverlay(null)
        setJoinNotice('You were removed by the host.')
      }
    },
    onError: setLoadError,
  })

  const playerIdRef = useRef('')
  playerIdRef.current = playerId

  // Deadline: computed against the server clock so every device agrees.
  const endsAtLocal = state?.endsAt ? state.endsAt - clockOffsetRef.current : null
  const timeLeftMs = endsAtLocal ? Math.max(0, endsAtLocal - Date.now()) : null

  useEffect(() => {
    if (phase === 'playing' && timeLeftMs !== null && timeLeftMs <= 0 && !timeUpRef.current) {
      timeUpRef.current = true
      runtimeRef.current?.destroy()
      runtimeRef.current = null
      gameSfx.win()
      setOverlay({ kind: 'timeup' })
    }
  }, [phase, timeLeftMs])

  // Stop the game loop if the page unmounts mid-round.
  useEffect(() => () => runtimeRef.current?.destroy(), [])

  const me = state?.leaderboard.find((entry) => entry.id === playerId)

  async function handleJoin() {
    const name = nameInput.trim()
    if (!name) {
      return
    }
    sound.unlock()
    gameSfx.unlock()
    const result = await join(name, divisionInput.trim())
    if ('error' in result) {
      setJoinNotice(result.error)
      return
    }
    setJoinNotice('')
    setPlayerId(result.playerId)
    setPlayerName(result.name)
    setTotal(result.total)
    setState(result.state)
    setPhase('playing')
    gameSfx.click()
    beginRound(pickNextGame(null), 1)
  }

  function beginRound(key: MiniGameKey, nextRound: number) {
    setCurrentKey(key)
    setRound(nextRound)
    setGameScore(0)
    setOverlay({ kind: 'start', gameKey: key, round: nextRound })
  }

  function startGame(key: MiniGameKey) {
    const container = containerRef.current
    if (!container || timeUpRef.current) {
      return
    }
    gameSfx.unlock()
    gameSfx.click()
    setOverlay(null)
    runtimeRef.current?.destroy()
    const runtime = createGameRuntime({
      container,
      onScore: setGameScore,
      onDone: (score) => void onGameDone(key, score),
    })
    runtimeRef.current = runtime
    try {
      MINI_GAMES[key].start(runtime)
    } catch (error) {
      console.error(error)
      void onGameDone(key, 0)
    }
  }

  async function onGameDone(key: MiniGameKey, score: number) {
    runtimeRef.current = null
    setPlayedTypes((previous) => new Set(previous).add(key))

    const ack = await submitScore(key, score)
    if (ack.ok && ack.total !== undefined) {
      setTotal(ack.total)
      if (ack.rank != null) {
        setMyRank(ack.rank)
      }
    } else if (ack.reason === 'event-ended') {
      setTotal((previous) => previous + score)
      timeUpRef.current = true
      setOverlay({ kind: 'timeup' })
      return
    } else {
      setTotal((previous) => previous + score)
    }
    setTotalPopped(true)
    setTimeout(() => setTotalPopped(false), 350)
    if (timeUpRef.current) {
      return
    }
    setOverlay({ kind: 'result', score, nextKey: pickNextGame(key), emoji: MINI_GAMES[key].emoji })
  }

  async function viewLeaderboard() {
    gameSfx.click()
    runtimeRef.current?.destroy()
    runtimeRef.current = null
    const result = await finish()
    if (result.ok && result.rank != null) {
      setMyRank(result.rank)
    }
    setOverlay(null)
    setPhase('leaderboard')
    sound.fanfare()
  }

  if (loadError && phase === 'join') {
    return (
      <AppShell eyebrow="Mini Games" title="This event is not available." description={loadError}>
        <Link to="/" className="brand-button-secondary inline-flex">
          Back to Home
        </Link>
      </AppShell>
    )
  }

  const game = currentKey ? MINI_GAMES[currentKey] : null
  const isOnPodium = phase === 'leaderboard' && me && me.rank <= 3

  return (
    <>
      {isOnPodium ? <Confetti pieces={110} /> : null}
      <AppShell
        eyebrow={state?.eventName ?? 'Mini Games'}
        title={
          phase === 'join'
            ? 'Join the Mini Games Marathon'
            : phase === 'leaderboard'
              ? `Great run, ${playerName}!`
              : `Go, ${playerName}!`
        }
        description={
          phase === 'join'
            ? 'Five office mini games in random order — every round adds to your combined total on the live leaderboard.'
            : phase === 'leaderboard'
              ? 'Here are the live standings. You can jump back in anytime — your total keeps growing.'
              : 'Finish a round, get a new random game. Keep playing to climb the leaderboard!'
        }
      >
        <div className="mx-auto max-w-2xl space-y-5">
          {phase === 'join' ? (
            <section className="panel-elevated p-6">
              <label htmlFor="mini-join-name" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                Your Name
              </label>
              <input
                id="mini-join-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                maxLength={40}
                placeholder="Enter your name"
                autoComplete="nickname"
                className="brand-input text-lg"
              />
              <label
                htmlFor="mini-join-division"
                className="mb-2 mt-4 block text-xs uppercase tracking-[0.25em] text-slate-700"
              >
                Division <span className="normal-case tracking-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="mini-join-division"
                value={divisionInput}
                onChange={(event) => setDivisionInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleJoin()
                  }
                }}
                maxLength={40}
                placeholder="e.g. Marketing"
                className="brand-input"
              />
              {joinNotice ? (
                <div className="notice-warning mt-3 rounded-2xl px-4 py-3 text-sm">{joinNotice}</div>
              ) : null}
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={!nameInput.trim() || state?.ended}
                className="brand-button-primary mt-5 flex w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{state?.ended ? 'Event has ended' : 'Start Playing'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : null}

          {phase === 'playing' ? (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Round</p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950">{round}</p>
                </div>
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Total</p>
                  <p
                    className="mt-1 font-display text-3xl font-bold tabular-nums text-signal transition-transform"
                    style={{ transform: totalPopped ? 'scale(1.18)' : 'scale(1)' }}
                  >
                    {total}
                  </p>
                </div>
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Rank</p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950">
                    {myRank ? `#${myRank}` : '—'}
                  </p>
                </div>
              </div>

              {/* Deadline pill */}
              {timeLeftMs !== null ? (
                <div
                  className={`panel-elevated flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold tabular-nums ${
                    timeLeftMs < 30_000 ? 'text-red-600' : 'text-slate-700'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  Event ends in {formatRemainingTime(timeLeftMs)}
                </div>
              ) : null}

              {/* Game area */}
              <section className="panel-elevated overflow-hidden p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-950">
                    {game ? `${game.emoji} ${game.name}` : 'Mini Games'}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* progress dots per game type */}
                    <span className="flex items-center gap-1" aria-label="Games played">
                      {Object.keys(MINI_GAMES).map((key) => (
                        <span
                          key={key}
                          className={`h-2 w-2 rounded-full ${
                            key === currentKey
                              ? 'bg-signal'
                              : playedTypes.has(key as MiniGameKey)
                                ? 'bg-green-500'
                                : 'bg-slate-300'
                          }`}
                        />
                      ))}
                    </span>
                    <span className="pill-tag tabular-nums">{gameScore}</span>
                  </div>
                </div>

                <div
                  ref={containerRef}
                  className="relative mx-auto aspect-[2/3] w-full max-w-[420px] touch-none select-none overflow-hidden rounded-[20px] bg-[#0a2540]"
                >
                  {/* Overlays */}
                  {overlay ? (
                    <div className="absolute inset-0 z-10 grid place-items-center bg-slate-950/75 p-6 backdrop-blur-sm">
                      <div className="animate-pop-in w-full max-w-sm rounded-[24px] bg-white p-6 text-center shadow-2xl">
                        {overlay.kind === 'start' && game ? (
                          <>
                            <p className="text-5xl">{game.emoji}</p>
                            <p className="mt-3 font-display text-2xl font-bold text-slate-950">
                              Round {overlay.round} — {game.name}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{game.instructions}</p>
                            <button
                              type="button"
                              onClick={() => startGame(overlay.gameKey)}
                              className="brand-button-primary mt-5 w-full"
                            >
                              Start ▶
                            </button>
                          </>
                        ) : null}
                        {overlay.kind === 'result' ? (
                          <>
                            <p className="text-4xl">{overlay.emoji}</p>
                            <p className="mt-2 font-display text-3xl font-black text-green-600">
                              +{overlay.score}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              Your total is now <b className="text-slate-950">{total}</b>
                              {myRank ? (
                                <>
                                  {' '}
                                  — rank <b className="text-slate-950">#{myRank}</b>
                                </>
                              ) : null}
                              <br />
                              Keep playing, your score keeps rising 🚀
                            </p>
                            <button
                              type="button"
                              onClick={() => beginRound(overlay.nextKey, round + 1)}
                              className="brand-button-primary mt-5 w-full"
                            >
                              Next: {MINI_GAMES[overlay.nextKey].emoji} {MINI_GAMES[overlay.nextKey].name} →
                            </button>
                            <button
                              type="button"
                              onClick={() => void viewLeaderboard()}
                              className="brand-button-ghost mt-2 w-full py-3 text-sm"
                            >
                              <Trophy className="h-4 w-4" /> Leaderboard
                            </button>
                          </>
                        ) : null}
                        {overlay.kind === 'timeup' ? (
                          <>
                            <p className="text-5xl">⏰</p>
                            <p className="mt-3 font-display text-2xl font-bold text-slate-950">Time&apos;s up!</p>
                            <p className="mt-1 text-sm text-slate-600">
                              The event has ended. Your final total:{' '}
                              <b className="font-display text-xl text-slate-950">{total}</b>
                            </p>
                            <button
                              type="button"
                              onClick={() => void viewLeaderboard()}
                              className="brand-button-primary mt-5 w-full"
                            >
                              🏆 View Leaderboard
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* D-pad for swipe games (also playable with swipes/arrows) */}
                {game?.needsDpad && !overlay ? (
                  <div className="mx-auto mt-4 grid w-44 grid-cols-3 gap-1.5" aria-label="Direction pad">
                    {(
                      [
                        [null, 'up', null],
                        ['left', null, 'right'],
                        [null, 'down', null],
                      ] as const
                    )
                      .flat()
                      .map((dir, index) =>
                        dir ? (
                          <button
                            key={index}
                            type="button"
                            aria-label={`Move ${dir}`}
                            onPointerDown={(event) => {
                              event.preventDefault()
                              runtimeRef.current?.emitDir(dir)
                            }}
                            className="rounded-xl border border-slate-200 bg-white py-3 text-lg font-bold text-slate-700 shadow-sm transition active:scale-95 active:bg-slate-100"
                          >
                            {dir === 'up' ? '↑' : dir === 'down' ? '↓' : dir === 'left' ? '←' : '→'}
                          </button>
                        ) : (
                          <span key={index} />
                        ),
                      )}
                  </div>
                ) : null}
              </section>
            </>
          ) : null}

          {phase === 'leaderboard' ? (
            <>
              {me ? (
                <section
                  className={`animate-pop-in panel-elevated flex flex-col items-center gap-2 p-6 text-center ${
                    isOnPodium ? 'animate-glow' : ''
                  }`}
                >
                  <Trophy className={`h-7 w-7 ${isOnPodium ? 'text-amber-500' : 'text-slate-400'}`} />
                  <p className="kicker">Your Position</p>
                  <p className="font-display text-5xl font-black text-slate-950">#{me.rank}</p>
                  <p className="text-sm text-slate-600">
                    <b className="text-slate-950">{me.total}</b> pts · {me.rounds} rounds · of{' '}
                    {state?.playerCount ?? 0} players
                  </p>
                </section>
              ) : null}

              <section className="panel-elevated p-6">
                <p className="kicker mb-4">Live Standings</p>
                <ul className="grid max-h-96 gap-2 overflow-y-auto pr-1">
                  {(state?.leaderboard ?? []).slice(0, 30).map((player) => {
                    const isMe = player.id === playerId
                    return (
                      <li
                        key={player.id}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                          isMe ? 'border-signal/30 bg-slate-950 text-white' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                              isMe ? 'bg-white/10 text-white' : 'bg-slate-950 text-white'
                            }`}
                          >
                            {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : player.rank}
                          </span>
                          <div className="min-w-0">
                            <p className={`truncate text-sm font-semibold ${isMe ? 'text-white' : 'text-slate-950'}`}>
                              {player.name}
                              {isMe ? ' (You)' : ''}
                            </p>
                            <p className={`text-[10px] uppercase tracking-[0.2em] ${isMe ? 'text-white/60' : 'text-slate-400'}`}>
                              {player.division} · {player.rounds} rounds
                            </p>
                          </div>
                        </div>
                        <span className={`font-display text-lg font-bold tabular-nums ${isMe ? 'text-white' : 'text-slate-950'}`}>
                          {player.total}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              {!state?.ended ? (
                <button
                  type="button"
                  onClick={() => {
                    gameSfx.click()
                    setPhase('playing')
                    beginRound(pickNextGame(currentKey), round + 1)
                  }}
                  className="brand-button-primary flex w-full"
                >
                  <Gamepad2 className="h-5 w-5" />
                  <span>Keep Playing</span>
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </AppShell>
    </>
  )
}
