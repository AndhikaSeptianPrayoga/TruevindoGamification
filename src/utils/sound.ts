/**
 * Lightweight sound-effect engine built on the Web Audio API.
 * No audio assets are bundled — every effect is synthesised on the fly,
 * so it works offline and adds zero network weight.
 */

const STORAGE_KEY = 'truevindo:sound-muted'

let audioContext: AudioContext | null = null
let muted = readMutedPreference()
const listeners = new Set<(muted: boolean) => void>()

function readMutedPreference() {
  if (typeof window === 'undefined') {
    return false
  }
  return window.localStorage.getItem(STORAGE_KEY) === 'true'
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null
  }

  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioCtor()
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return audioContext
}

interface ToneOptions {
  freq: number
  duration: number
  type?: OscillatorType
  gain?: number
  /** Slide the frequency towards this value across the tone. */
  slideTo?: number
  /** Delay (seconds) before the tone starts. */
  delay?: number
}

function playTone(ctx: AudioContext, options: ToneOptions) {
  const { freq, duration, type = 'sine', gain = 0.18, slideTo, delay = 0 } = options
  const start = ctx.currentTime + delay
  const end = start + duration

  const oscillator = ctx.createOscillator()
  const amp = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(freq, start)
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), end)
  }

  // Quick attack, smooth exponential release for a pleasant, non-clicky tone.
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  amp.gain.exponentialRampToValueAtTime(0.0001, end)

  oscillator.connect(amp)
  amp.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(end + 0.02)
}

function withContext(play: (ctx: AudioContext) => void) {
  if (muted) {
    return
  }
  const ctx = getContext()
  if (ctx) {
    play(ctx)
  }
}

export const sound = {
  /** Resume/create the audio context — call from a user gesture (tap/click). */
  unlock() {
    getContext()
  },

  isMuted() {
    return muted
  },

  setMuted(next: boolean) {
    muted = next
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(next))
    }
    listeners.forEach((listener) => listener(muted))
  },

  toggleMute() {
    this.setMuted(!muted)
    return muted
  },

  subscribe(listener: (muted: boolean) => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** Short haptic buzz on supported devices (independent of the mute toggle). */
  vibrate(pattern: number | number[]) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern)
      } catch {
        // Vibration not allowed / unavailable — ignore.
      }
    }
  },

  /** Soft tap when an answer option is selected. */
  select() {
    withContext((ctx) => {
      playTone(ctx, { freq: 440, duration: 0.09, type: 'triangle', gain: 0.14 })
      playTone(ctx, { freq: 660, duration: 0.12, type: 'triangle', gain: 0.1, delay: 0.04 })
    })
  },

  /** Subtle tick while a new question loads. */
  whoosh() {
    withContext((ctx) => {
      playTone(ctx, { freq: 220, duration: 0.32, type: 'sine', gain: 0.12, slideTo: 720 })
    })
  },

  /** Gentle countdown tick for the final seconds. */
  tick() {
    withContext((ctx) => {
      playTone(ctx, { freq: 880, duration: 0.06, type: 'square', gain: 0.06 })
    })
  },

  /** Bright ascending arpeggio for a correct answer. */
  correct() {
    withContext((ctx) => {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
      notes.forEach((freq, index) => {
        playTone(ctx, { freq, duration: 0.18, type: 'triangle', gain: 0.16, delay: index * 0.08 })
      })
    })
  },

  /** Descending two-tone buzz for a wrong answer. */
  wrong() {
    withContext((ctx) => {
      playTone(ctx, { freq: 311.13, duration: 0.22, type: 'sawtooth', gain: 0.12, slideTo: 196 })
      playTone(ctx, { freq: 233.08, duration: 0.28, type: 'sawtooth', gain: 0.1, slideTo: 150, delay: 0.16 })
    })
  },

  /** Triumphant fanfare for the finish / celebration screen. */
  fanfare() {
    withContext((ctx) => {
      const melody = [
        { freq: 523.25, delay: 0 },
        { freq: 659.25, delay: 0.12 },
        { freq: 783.99, delay: 0.24 },
        { freq: 1046.5, delay: 0.36 },
        { freq: 783.99, delay: 0.52 },
        { freq: 1046.5, delay: 0.64 },
        { freq: 1318.51, delay: 0.78 },
      ]
      melody.forEach(({ freq, delay }) => {
        playTone(ctx, { freq, duration: 0.24, type: 'triangle', gain: 0.16, delay })
        playTone(ctx, { freq: freq / 2, duration: 0.24, type: 'sine', gain: 0.08, delay })
      })
    })
  },
}
