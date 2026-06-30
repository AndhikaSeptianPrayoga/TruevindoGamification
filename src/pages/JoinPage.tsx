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
  const [pinCode, setPinCode] = useState(params.pin ?? '482913')
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
      title="Truevindo Games delivers corporate-grade live quizzes for modern events."
      description="Enter the QUIZ ID and your display name to join the session being hosted. This view is optimized for smartphones and stays in sync in real time."
      aside={
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Format" value="Live Quiz" hint="In sync with the host screen" />
          <StatCard label="Experience" value="B2B Grade" hint="Elegant, clean, professional" />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-panel backdrop-blur">
          <div className="mb-8 flex items-center gap-3 text-sm text-slate-300">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span>Secure entry for participants — no permanent account required</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">
                Quiz ID
              </label>
              <input
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-lg text-white outline-none transition focus:border-accent"
                placeholder="e.g. 482913"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-lg text-white outline-none transition focus:border-accent"
                placeholder="Enter your name"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            <button
              type="button"
              disabled={isLoading || !pinCode || !displayName}
              onClick={handleJoin}
              className="flex w-full items-center justify-center gap-3 rounded-3xl bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing...' : 'Enter Lobby'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <ScanLine className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">How to Join</p>
                <h2 className="font-display text-2xl font-semibold text-white">Participant Flow</h2>
              </div>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
              <p>1. Enter the `QUIZ ID` shared by the host.</p>
              <p>2. Fill in a display name for the waiting room list.</p>
              <p>3. Wait for the host screen to start the first question.</p>
              <p>4. Answer fast to earn bonus points.</p>
            </div>
          </div>
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-accent/20 to-signal/20 p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-200">Experience Note</p>
            <p className="mt-3 text-lg leading-8 text-white">
              The UI is designed to feel premium whether opened on a personal device or viewed
              together on the big screen at a company event.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
