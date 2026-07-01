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
      description="Masukkan QUIZ ID dan nama Anda untuk bergabung ke sesi live. Tampilan ini dirancang untuk perangkat mobile, cepat dipahami, dan tetap sinkron secara real time dalam suasana event korporat modern."
      aside={
        <div className="grid gap-3 md:grid-cols-2">
          <StatCard label="Format" value="Live Quiz" hint="Satu flow sinkron dari host ke peserta" />
          <StatCard label="Style" value="Future B2B" hint="Bersih, premium, event-ready" />
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="panel-elevated p-6">
          <div className="mb-8 flex items-center gap-3 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-signal" />
            <span>Akses peserta cepat tanpa akun permanen</span>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-500">
                QUIZ ID
              </label>
              <input
                value={pinCode}
                onChange={(event) => setPinCode(event.target.value)}
                className="brand-input text-lg"
                placeholder="Masukkan PIN sesi"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-500">
                Nama Tampilan
              </label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="brand-input text-lg"
                placeholder="Masukkan nama Anda"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {!error ? (
              <p className="text-sm leading-7 text-slate-500">
                Gunakan PIN yang dibagikan host pada layar utama acara atau melalui QR code sesi.
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
            <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
              <p>1. Masukkan `QUIZ ID` yang dibagikan host.</p>
              <p>2. Isi nama tampilan untuk waiting room.</p>
              <p>3. Tunggu host memulai pertanyaan pertama.</p>
              <p>4. Jawab cepat untuk mendapat bonus poin.</p>
            </div>
          </div>
          <div className="panel-dark p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Experience Note</p>
            <p className="mt-3 text-lg leading-8 text-white">
              Antarmuka dibuat agar tetap terasa premium saat dibuka di ponsel peserta maupun
              saat dipresentasikan pada layar besar acara korporat.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
