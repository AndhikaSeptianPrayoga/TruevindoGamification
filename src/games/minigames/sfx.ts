import { sound } from '@/utils/sound'

/**
 * Synthesized game sound effects (ported from the original Mini Games sfx.js).
 * Respects the app-wide mute state from the shared sound util, so the floating
 * SoundToggle controls these too. All tones are generated — no audio files.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null

function ensure(): AudioContext | null {
  if (sound.isMuted()) {
    return null
  }
  if (!ctx) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtor) {
      return null
    }
    ctx = new AudioCtor()
    master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') {
    void ctx.resume()
  }
  return ctx
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.6, slideTo?: number) {
  const audio = ensure()
  if (!audio || !master) {
    return
  }
  const t = audio.currentTime
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  }
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain)
  gain.connect(master)
  osc.start(t)
  osc.stop(t + dur + 0.03)
}

/** Short burst of filtered noise — used for crashes. */
function noise(dur: number, vol = 0.5) {
  const audio = ensure()
  if (!audio || !master) {
    return
  }
  const t = audio.currentTime
  const samples = Math.floor(audio.sampleRate * dur)
  const buffer = audio.createBuffer(1, samples, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < samples; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / samples)
  }
  const source = audio.createBufferSource()
  source.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1200
  const gain = audio.createGain()
  gain.gain.value = vol
  source.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  source.start(t)
}

function seq(notes: Array<{ f: number; at: number; d?: number }>) {
  notes.forEach((note) => setTimeout(() => tone(note.f, note.d ?? 0.16, 'triangle', 0.6), note.at))
}

export const gameSfx = {
  unlock() {
    ensure()
  },
  click() {
    tone(440, 0.06, 'square', 0.4)
  },
  flap() {
    tone(520, 0.12, 'triangle', 0.5, 720)
  },
  score() {
    tone(880, 0.1, 'square', 0.4, 1320)
  },
  eat() {
    tone(660, 0.09, 'square', 0.5, 990)
    sound.vibrate(25)
  },
  move() {
    tone(300, 0.04, 'sine', 0.25)
  },
  bump() {
    tone(140, 0.08, 'sawtooth', 0.4)
    sound.vibrate(15)
  },
  slide() {
    tone(420, 0.07, 'triangle', 0.45, 300)
  },
  crash() {
    noise(0.45, 0.6)
    tone(180, 0.4, 'sawtooth', 0.4, 60)
    sound.vibrate(200)
  },
  win() {
    seq([
      { f: 523, at: 0 },
      { f: 659, at: 110 },
      { f: 784, at: 220 },
      { f: 1047, at: 330, d: 0.3 },
    ])
    sound.vibrate([40, 40, 120])
  },
}
