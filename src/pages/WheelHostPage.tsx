import { Plus, RotateCw, Sparkles, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { WheelSpinPayload, WheelState } from '@shared/types/wheel'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AppShell } from '@/components/common/AppShell'
import { Confetti } from '@/components/common/Confetti'
import { WheelOfNames } from '@/components/wheel/WheelOfNames'
import { useWheelSocket } from '@/hooks/useWheelSocket'
import { sound } from '@/utils/sound'

export default function WheelHostPage() {
  const [wheel, setWheel] = useState<WheelState | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [notice, setNotice] = useState('')
  const [activeSpin, setActiveSpin] = useState<WheelSpinPayload | null>(null)
  const [winnerName, setWinnerName] = useState<string | null>(null)

  const { addEntry, removeEntry, clearEntries, spin, newWheel } = useWheelSocket({
    role: 'admin',
    onState: setWheel,
    onSpin: (payload) => {
      setNotice('')
      setWinnerName(null)
      setActiveSpin(payload)
      sound.whoosh()
    },
  })

  const entries = wheel?.entries ?? []
  const isSpinning = wheel?.isSpinning ?? false
  const joinUrl = wheel ? `${window.location.origin}/wheel/${wheel.wheelId}` : ''

  async function handleAddEntry() {
    const name = nameInput.trim()
    if (!name) {
      return
    }
    const result = await addEntry(name, 'admin')
    if (result && 'error' in result) {
      setNotice(result.error)
      return
    }
    setNotice('')
    setNameInput('')
    sound.select()
  }

  async function handleSpin() {
    sound.unlock()
    const result = await spin()
    if (result && 'error' in result) {
      setNotice(result.error)
    }
  }

  function handleSpinEnd(payload: WheelSpinPayload) {
    const winner = entries.find((entry) => entry.id === payload.winnerId)
    if (winner) {
      setWinnerName(winner.name)
      sound.fanfare()
      sound.vibrate([0, 40, 60, 40])
    }
  }

  return (
    <>
      {winnerName ? <Confetti pieces={130} /> : null}
      <AppShell
        eyebrow="Control Room"
        title="Wheel of Names"
        description="Add names manually or let participants join by scanning the QR code. Everyone connected sees the same wheel spin to the same winner in real time."
        aside={<AdminSidebar />}
      >
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          {/* Wheel + spin */}
          <section className="panel-elevated flex flex-col items-center gap-6 p-6">
            <WheelOfNames entries={entries} spin={activeSpin} onSpinEnd={handleSpinEnd} />

            {/* Winner announcement — polite live region for screen readers */}
            <div aria-live="polite" className="min-h-[64px] w-full">
              {winnerName ? (
                <div className="surface-success animate-pop-in flex items-center justify-center gap-3 rounded-[24px] px-6 py-4 text-center">
                  <Sparkles className="h-6 w-6 shrink-0 text-green-700" />
                  <p className="font-display text-2xl font-bold text-green-800">
                    Winner: {winnerName}
                  </p>
                  <button
                    type="button"
                    onClick={() => setWinnerName(null)}
                    aria-label="Dismiss winner announcement"
                    className="ml-2 rounded-full p-1.5 text-green-700 transition hover:bg-green-700/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : isSpinning ? (
                <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Spinning…
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => void handleSpin()}
              disabled={isSpinning || entries.length < 2}
              className="brand-button-primary w-full max-w-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw className={`h-5 w-5 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Spinning…' : 'Spin the Wheel'}</span>
            </button>
            {entries.length < 2 ? (
              <p className="text-sm text-slate-600">Add at least 2 names to spin.</p>
            ) : null}
          </section>

          {/* QR + entries management */}
          <section className="space-y-4">
            <div className="panel-elevated p-6 text-center">
              <p className="kicker">Join by QR</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Participants scan this code, enter their name, and instantly appear on the wheel.
              </p>
              <div className="mx-auto mt-4 flex w-fit justify-center rounded-[24px] border border-slate-200 bg-white p-4">
                {joinUrl ? <QRCodeSVG value={joinUrl} size={168} /> : null}
              </div>
              {joinUrl ? (
                <p className="mt-3 break-all text-xs text-slate-500">{joinUrl}</p>
              ) : null}
            </div>

            <div className="panel-elevated p-6">
              <div className="flex items-center justify-between">
                <p className="kicker">Entries</p>
                <span className="pill-tag">{entries.length} names</span>
              </div>

              <div className="mt-4 flex gap-2">
                <label htmlFor="wheel-name-input" className="sr-only">
                  Add a name to the wheel
                </label>
                <input
                  id="wheel-name-input"
                  value={nameInput}
                  onChange={(event) => setNameInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      void handleAddEntry()
                    }
                  }}
                  maxLength={28}
                  placeholder="Type a name"
                  className="brand-input"
                  disabled={isSpinning}
                />
                <button
                  type="button"
                  onClick={() => void handleAddEntry()}
                  disabled={isSpinning || !nameInput.trim()}
                  aria-label="Add name"
                  className="brand-button-secondary shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>

              {notice ? (
                <div className="notice-warning mt-3 rounded-2xl px-4 py-3 text-sm">{notice}</div>
              ) : null}

              <ul className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="list-item-soft flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{entry.name}</p>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        {entry.source === 'participant' ? 'Joined via QR' : 'Added by host'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeEntry(entry.id)}
                      disabled={isSpinning}
                      aria-label={`Remove ${entry.name} from the wheel`}
                      className="shrink-0 rounded-xl border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {entries.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                    No names yet — add one above or share the QR code.
                  </li>
                ) : null}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void clearEntries()
                    setWinnerName(null)
                  }}
                  disabled={isSpinning || entries.length === 0}
                  className="brand-button-ghost flex-1 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear names
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void newWheel()
                    setWinnerName(null)
                    setActiveSpin(null)
                    setNotice('')
                  }}
                  disabled={isSpinning}
                  className="brand-button-ghost flex-1 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  New wheel
                </button>
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    </>
  )
}
