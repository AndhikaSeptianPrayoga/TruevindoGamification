import { ArrowRight, Flame, Keyboard } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { SpamEndedPayload, SpamGameState } from '@shared/types/spam'
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

function pickWord(targets: string[], previous: string): string {
  if (targets.length <= 1) {
    return targets[0] ?? 'truevindo'
  }
  let word = previous
  while (word === previous) {
    word = targets[Math.floor(Math.random() * targets.length)]
  }
  return word
}

export default function SpamPlayPage() {
  const { gameId = '' } = useParams()
  const [game, setGame] = useState<SpamGameState | null>(null)
  const [loadError, setLoadError] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [joined, setJoined] = useState(false)
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [myScore, setMyScore] = useState(0)
  const [myRank, setMyRank] = useState<number | null>(null)
  const [ofPlayers, setOfPlayers] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  const [typed, setTyped] = useState('')
  const [combo, setCombo] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [milestone, setMilestone] = useState('')
  const [warning, setWarning] = useState('')
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null)
  const [ended, setEnded] = useState<SpamEndedPayload | null>(null)
  const [kickedNotice, setKickedNotice] = useState('')

  const clockOffsetRef = useRef(0)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastLenRef = useRef(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const floatLayerRef = useRef<HTMLDivElement | null>(null)
  useTicker(100)

  const { join, submit } = useSpamSocket({
    gameId,
    role: 'player',
    onState: (state) => {
      clockOffsetRef.current = state.serverNow - Date.now()
      setGame((previous) => {
        // A fresh round just began — clear the local score/word state.
        if (previous?.status !== 'starting' && state.status === 'starting') {
          setMyScore(0)
          setCombo(0)
          setStreak(0)
          setBestStreak(0)
          setMilestone('')
          setMyRank(null)
          setEnded(null)
          setTyped('')
          lastLenRef.current = 0
        }
        if (previous?.status === 'starting' && state.status === 'running') {
          setCurrentWord((word) => pickWord(state.targets, word))
          setTimeout(() => inputRef.current?.focus(), 50)
        }
        return state
      })
      setCurrentWord((word) => (state.targets.includes(word) ? word : pickWord(state.targets, word)))
    },
    onEnded: (payload) => {
      setEnded(payload)
      const iWon = payload.winner?.id === playerIdRef.current
      if (iWon) {
        sound.fanfare()
        sound.vibrate([0, 40, 60, 40])
      } else {
        sound.correct()
      }
    },
    onReset: () => {
      // The host wiped the game — everyone re-joins for the next round.
      setJoined(false)
      setMyScore(0)
      setCombo(0)
      setMyRank(null)
      setEnded(null)
    },
    onKicked: (kickedId) => {
      if (kickedId === playerIdRef.current) {
        setJoined(false)
        setKickedNotice('You were removed by the host.')
      }
    },
    onError: setLoadError,
  })

  const playerIdRef = useRef('')
  playerIdRef.current = playerId

  const status = game?.status ?? 'waiting'
  const isRunning = status === 'running'
  const syncedNow = Date.now() + clockOffsetRef.current
  const countdownSeconds =
    joined && status === 'starting' && game?.startsAt
      ? Math.max(0, Math.ceil((game.startsAt - syncedNow) / 1000))
      : null
  const remainingSeconds =
    isRunning && game?.endsAt ? Math.max(0, Math.ceil((game.endsAt - syncedNow) / 1000)) : game?.duration ?? 60
  const timerTone = isRunning && remainingSeconds <= 5
    ? 'animate-pulse text-red-600'
    : isRunning && remainingSeconds <= 10
      ? 'text-amber-600'
      : 'text-slate-950'

  function flashBad(message?: string) {
    setFlash('bad')
    setTimeout(() => setFlash(null), 300)
    sound.miss()
    // A wrong keystroke breaks the streak (the combo has its own idle timer).
    setStreak(0)
    if (message) {
      setWarning(message)
      setTimeout(() => setWarning(''), 1400)
    }
  }

  function spawnPlus() {
    const layer = floatLayerRef.current
    const input = inputRef.current
    if (!layer || !input) {
      return
    }
    const rect = input.getBoundingClientRect()
    const span = document.createElement('div')
    span.className = 'float-plus'
    span.textContent = '+1'
    span.style.left = `${rect.left + rect.width / 2 + (Math.random() * 80 - 40)}px`
    span.style.top = `${rect.top}px`
    layer.appendChild(span)
    setTimeout(() => span.remove(), 900)
  }

  async function handleJoin() {
    const name = nameInput.trim()
    if (!name) {
      return
    }
    sound.unlock()
    setKickedNotice('')
    const result = await join(name)
    if ('error' in result) {
      setLoadError(result.error)
      return
    }
    setJoined(true)
    setPlayerId(result.playerId)
    setPlayerName(result.name)
    setMyScore(result.score)
    setGame(result.state)
    setCurrentWord((word) => (result.state.targets.includes(word) ? word : pickWord(result.state.targets, '')))
    sound.select()
    sound.vibrate(25)
  }

  function handleInput(value: string) {
    // Autofill / programmatic paste detection: >3 chars appearing at once.
    if (value.length - lastLenRef.current > 3) {
      setTyped('')
      lastLenRef.current = 0
      flashBad('Type manually!')
      return
    }
    lastLenRef.current = value.length
    const word = value.trim().toLowerCase()
    if (!word) {
      setTyped(value)
      return
    }
    if (word === currentWord) {
      setTyped('')
      lastLenRef.current = 0
      void submitHit(currentWord)
      setCurrentWord((previous) => pickWord(game?.targets ?? [previous], previous))
      return
    }
    if (!currentWord.startsWith(word)) {
      // Diverged from the shown word — reset gently.
      setTyped('')
      lastLenRef.current = 0
      flashBad()
      return
    }
    setTyped(value)
  }

  async function submitHit(word: string) {
    const result = await submit(word)
    if (result.ok) {
      setMyScore(result.score ?? 0)
      if (result.rank != null) {
        setMyRank(result.rank)
        setOfPlayers(result.of ?? 0)
      }
      setCombo((previous) => {
        const next = previous + 1
        sound.hit(next)
        return next
      })
      if (comboTimerRef.current) {
        clearTimeout(comboTimerRef.current)
      }
      comboTimerRef.current = setTimeout(() => setCombo(0), 1200)
      // Streak = consecutive correct words without a single wrong keystroke.
      setStreak((previous) => {
        const next = previous + 1
        setBestStreak((best) => Math.max(best, next))
        if (next === 5 || next === 10 || (next > 10 && next % 10 === 0)) {
          setMilestone(next >= 20 ? `🔥 UNSTOPPABLE — ${next} STREAK!` : next >= 10 ? `🔥 ON FIRE — ${next} STREAK!` : `⚡ ${next} STREAK!`)
          sound.correct()
          sound.vibrate([0, 30, 40, 30])
          setTimeout(() => setMilestone(''), 1600)
        }
        return next
      })
      setFlash('good')
      setTimeout(() => setFlash(null), 120)
      spawnPlus()
    } else if (result.reason === 'time-up') {
      flashBad('Time is up!')
    } else if (result.reason === 'not-running') {
      flashBad('The round has not started')
    }
    // 'too-fast' is silently ignored — too fast to be human, no reward.
  }

  if (loadError && !joined) {
    return (
      <AppShell eyebrow="Spamming Games" title="This game is not available." description={loadError}>
        <Link to="/" className="brand-button-secondary inline-flex">
          Back to Home
        </Link>
      </AppShell>
    )
  }

  return (
    <>
      {ended && ended.winner?.id === playerId ? <Confetti pieces={120} /> : null}
      {countdownSeconds !== null ? <SpamCountdownOverlay secondsLeft={countdownSeconds} /> : null}
      <div ref={floatLayerRef} aria-hidden className="pointer-events-none fixed inset-0 z-[70]" />
      <AppShell
        eyebrow={game?.title ?? 'Spamming Games'}
        title={joined ? `Go, ${playerName}!` : 'Join the Spam Challenge'}
        description={
          joined
            ? 'Type the word shown below as many times as you can before the timer runs out. Faster fingers, higher rank.'
            : 'Enter your name to join. When the host starts the round, type the target word as fast as you can!'
        }
      >
        <div className="mx-auto max-w-2xl space-y-5">
          {!joined ? (
            <section className="panel-elevated p-6">
              <label htmlFor="spam-join-name" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                Your Name
              </label>
              <input
                id="spam-join-name"
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleJoin()
                  }
                }}
                maxLength={24}
                placeholder="Enter your name"
                autoComplete="nickname"
                className="brand-input text-lg"
              />
              {kickedNotice ? (
                <div className="notice-warning mt-3 rounded-2xl px-4 py-3 text-sm">{kickedNotice}</div>
              ) : null}
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={!nameInput.trim()}
                className="brand-button-primary mt-4 flex w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Join the Game</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : (
            <>
              {/* Timer + score row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Time</p>
                  <p className={`mt-1 font-display text-3xl font-bold tabular-nums ${timerTone}`}>
                    {formatRemainingTime(remainingSeconds * 1000)}
                  </p>
                </div>
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Score</p>
                  <p
                    className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950 transition-transform"
                    style={{ transform: flash === 'good' ? 'scale(1.18)' : 'scale(1)' }}
                  >
                    {myScore}
                  </p>
                </div>
                <div className="panel-elevated p-4 text-center">
                  <p className="kicker">Rank</p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums text-slate-950">
                    {myRank ? `#${myRank}` : '—'}
                    {myRank && ofPlayers ? (
                      <span className="text-sm font-semibold text-slate-500">/{ofPlayers}</span>
                    ) : null}
                  </p>
                </div>
              </div>

              {/* Target word + input */}
              <section className="panel-elevated relative overflow-hidden p-6 text-center">
                <div className="flex items-center justify-between">
                  <p className="kicker">Type This Word</p>
                  {streak >= 2 ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                        streak >= 10
                          ? 'bg-red-500/15 text-red-600'
                          : streak >= 5
                            ? 'bg-orange-500/15 text-orange-600'
                            : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      <Flame className="h-3.5 w-3.5" />
                      Streak {streak}
                    </span>
                  ) : null}
                </div>
                <p
                  key={currentWord}
                  className="animate-pop-in mt-3 select-none break-all font-display text-5xl font-black uppercase tracking-[0.12em] md:text-6xl"
                  aria-label={`Type the word ${currentWord}`}
                >
                  {(currentWord || '—').split('').map((letter, index) => {
                    const isTyped = index < typed.trim().length
                    return (
                      <span
                        key={`${index}-${letter}`}
                        className={`inline-block transition-all duration-100 ${
                          isTyped ? 'scale-110 text-green-600' : 'bg-gradient-to-br from-signal to-accent bg-clip-text text-transparent'
                        }`}
                      >
                        {letter}
                      </span>
                    )
                  })}
                </p>

                {milestone ? (
                  <p className="milestone-pop mt-3 font-display text-2xl font-black text-orange-600">
                    {milestone}
                  </p>
                ) : null}

                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(event) => handleInput(event.target.value)}
                  onPaste={(event) => {
                    event.preventDefault()
                    flashBad('No pasting!')
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    flashBad('No pasting!')
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                  onKeyDown={(event) => {
                    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
                      event.preventDefault()
                      flashBad('No pasting!')
                    }
                  }}
                  disabled={!isRunning}
                  placeholder={isRunning ? 'Type here as fast as you can!' : 'Waiting for the round…'}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Type the target word here"
                  className={`brand-input mt-5 text-center font-display text-2xl font-bold tracking-[0.08em] transition-shadow ${
                    flash === 'good'
                      ? 'ring-4 ring-green-400/50'
                      : flash === 'bad'
                        ? 'input-shake ring-4 ring-red-400/60'
                        : ''
                  }`}
                />

                <div aria-live="polite" className="mt-3 min-h-[28px]">
                  {warning ? (
                    <p className="text-sm font-semibold text-red-600">{warning}</p>
                  ) : combo >= 3 ? (
                    <p className="animate-pop-in inline-flex items-center gap-1.5 text-sm font-bold text-amber-600">
                      <Flame className="h-4 w-4" /> Combo x{combo}
                    </p>
                  ) : null}
                </div>
              </section>

              {/* Status notice */}
              {!isRunning && status !== 'starting' ? (
                <div className="panel-elevated flex items-center justify-center gap-3 p-5 text-sm text-slate-700">
                  <Keyboard className="h-4 w-4 shrink-0 text-signal" />
                  {status === 'ended'
                    ? 'Round over — wait for the host to start the next one!'
                    : 'Waiting for the host to start the round…'}
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* Result overlay */}
        {ended && joined ? (
          <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="panel-elevated animate-pop-in w-full max-w-md p-8 text-center">
              <p className="font-display text-3xl font-bold text-slate-950">
                {ended.winner?.id === playerId ? '🎉 You Win!' : "⏱️ Time's Up!"}
              </p>
              {(() => {
                const me = ended.leaderboard.find((entry) => entry.id === playerId)
                return me ? (
                  <p className="mt-3 text-sm text-slate-600">
                    You finished <span className="font-display text-2xl font-bold text-slate-950">#{me.rank}</span>{' '}
                    with <b>{me.score}</b> hits of {ended.leaderboard.length} players
                  </p>
                ) : null
              })()}
              {bestStreak >= 3 ? (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-4 py-1.5 text-sm font-bold text-amber-700">
                  <Flame className="h-4 w-4" /> Best streak: {bestStreak} in a row
                </p>
              ) : null}
              {ended.winner ? (
                <p className="mt-4 text-sm text-slate-600">
                  🏆 Winner: <b className="text-slate-950">{ended.winner.name}</b> ({ended.winner.score})
                </p>
              ) : null}
              <button type="button" onClick={() => setEnded(null)} className="brand-button-primary mt-7 px-8">
                OK
              </button>
            </div>
          </div>
        ) : null}
      </AppShell>
    </>
  )
}
