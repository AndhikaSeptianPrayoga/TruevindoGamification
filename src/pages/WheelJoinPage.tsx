import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { WheelSpinPayload, WheelState } from '@shared/types/wheel'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { WheelOfNames } from '@/components/wheel/WheelOfNames'
import { useWheelSocket } from '@/hooks/useWheelSocket'
import { sound } from '@/utils/sound'

export default function WheelJoinPage() {
  const { wheelId = '' } = useParams()
  const [wheel, setWheel] = useState<WheelState | null>(null)
  const [name, setName] = useState('')
  const [joinedName, setJoinedName] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [loadError, setLoadError] = useState('')
  const [activeSpin, setActiveSpin] = useState<WheelSpinPayload | null>(null)
  const [winnerName, setWinnerName] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)

  const { addEntry } = useWheelSocket({
    wheelId,
    role: 'participant',
    onState: setWheel,
    onSpin: (payload) => {
      setWinnerName(null)
      setActiveSpin(payload)
      sound.whoosh()
    },
    onError: setLoadError,
  })

  const entries = wheel?.entries ?? []

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    // First user gesture — unlock audio for the spin/winner sounds later.
    sound.unlock()
    setIsJoining(true)
    const result = await addEntry(trimmed, 'participant')
    setIsJoining(false)
    if (result && 'error' in result) {
      setNotice(result.error)
      return
    }
    setNotice('')
    setJoinedName(trimmed)
    sound.select()
    sound.vibrate(25)
  }

  function handleSpinEnd(payload: WheelSpinPayload) {
    const winner = entries.find((entry) => entry.id === payload.winnerId)
    if (winner) {
      setWinnerName(winner.name)
      sound.fanfare()
      sound.vibrate([0, 40, 60, 40])
    }
  }

  if (loadError) {
    return (
      <AppShell
        eyebrow="Wheel of Names"
        title="This wheel is not available."
        description={loadError}
      >
        <Link to="/" className="brand-button-secondary inline-flex">
          Back to Home
        </Link>
      </AppShell>
    )
  }

  return (
    <>
      {winnerName ? <Confetti pieces={110} /> : null}
      <AppShell
        eyebrow="Wheel of Names"
        title={joinedName ? `You're on the wheel, ${joinedName}!` : 'Join the Wheel of Names'}
        description={
          joinedName
            ? 'Watch this screen — the wheel below spins live, in sync with the host.'
            : 'Enter your name to be added to the wheel on the host screen.'
        }
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {!joinedName ? (
            <section className="panel-elevated p-6">
              <label
                htmlFor="wheel-join-name"
                className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700"
              >
                Your Name
              </label>
              <input
                id="wheel-join-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleJoin()
                  }
                }}
                maxLength={28}
                placeholder="Enter your name"
                autoComplete="nickname"
                className="brand-input text-lg"
              />

              {notice ? (
                <div className="notice-warning mt-3 rounded-2xl px-4 py-3 text-sm">{notice}</div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={isJoining || !name.trim()}
                className="brand-button-primary mt-4 flex w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{isJoining ? 'Joining…' : 'Put Me on the Wheel'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          ) : (
            <div className="notice-success flex items-center justify-center gap-2 rounded-[24px] px-5 py-4 text-sm font-semibold">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Your name is live on the host screen. Good luck!
            </div>
          )}

          <section className="panel-elevated p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="kicker">Live Wheel</p>
              <span className="pill-tag">{entries.length} names</span>
            </div>
            <WheelOfNames entries={entries} spin={activeSpin} onSpinEnd={handleSpinEnd} />

            <div aria-live="polite" className="mt-4 min-h-[56px]">
              {winnerName ? (
                <div className="surface-success animate-pop-in flex items-center justify-center gap-3 rounded-[24px] px-6 py-4 text-center">
                  <Sparkles className="h-6 w-6 shrink-0 text-green-700" />
                  <p className="font-display text-xl font-bold text-green-800">
                    Winner: {winnerName}
                    {joinedName && winnerName === joinedName ? ' — that’s you! 🎉' : ''}
                  </p>
                </div>
              ) : wheel?.isSpinning ? (
                <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Spinning…
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </AppShell>
    </>
  )
}
