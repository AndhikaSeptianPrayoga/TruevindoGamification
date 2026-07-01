import { ArrowRight, ScanLine, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { StatCard } from '@/components/common/StatCard'
import { joinSession } from '@/utils/api'
import { useParticipantStore } from '@/stores/useParticipantStore'
import { sound } from '@/utils/sound'

export default function JoinPage() {
  const params = useParams()
  const navigate = useNavigate()
  const { setParticipantSession } = useParticipantStore()
  const [pinCode, setPinCode] = useState(params.pin ?? '')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    // First user gesture — unlock the Web Audio context for later sound effects.
    sound.unlock()
    sound.select()
    try {
      setIsLoading(true)
      setError('')
      const payload = await joinSession({ pinCode, displayName })
      setParticipantSession(payload.participantId, payload.sessionState)
      navigate(`/lobby/${payload.sessionId}`)
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Failed to join the session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell
      eyebrow="Corporate Quiz Platform"
      title="Live quiz experience with a professional, modern, future-ready event interface."
      description="Enter the QUIZ ID and your display name to join the live session. This interface is optimized for mobile devices, easy to understand, and stays in sync throughout a modern corporate event."
      aside={
        <div className="grid gap-3">
          <StatCard label="Format" value="Live Quiz" hint="One synchronized flow from host to participants" />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel-elevated p-6">
          <div className="mb-8 flex items-center gap-3 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <span>Fast participant access with no permanent account required</span>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="join-pin-code" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                QUIZ ID
              </label>
              <input
                id="join-pin-code"
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value)}
                className="brand-input text-lg"
                placeholder="Enter the session PIN"
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="join-display-name" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
                Display Name
              </label>
              <input
                id="join-display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="brand-input text-lg"
                placeholder="Enter your name"
                autoComplete="nickname"
              />
            </div>

            {error ? (
              <div className="notice-danger rounded-2xl px-4 py-3 text-sm">
                {error}
              </div>
            ) : null}

            {!error ? (
              <p className="text-sm leading-7 text-slate-700">
                Use the PIN shared by the host on the main event screen or through the session QR code.
              </p>
            ) : null}

            <button
              type="button"
              disabled={isLoading || !pinCode || !displayName}
              onClick={handleJoin}
              className="brand-button-primary flex w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : 'Enter Lobby'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="panel-elevated p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-950 p-3">
                <ScanLine className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="kicker">How to Join</p>
                <h2 className="font-display text-2xl font-semibold text-slate-950">Participant Flow</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-700">
              <p>1. Enter the `QUIZ ID` shared by the host.</p>
              <p>2. Fill in a display name for the waiting room.</p>
              <p>3. Wait for the host to launch the first question.</p>
              <p>4. Answer quickly to earn bonus points.</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
