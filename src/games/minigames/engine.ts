import type { Direction, GameApi } from './types'

/** Logical resolution shared by all games (scaled responsively via CSS). */
export const GAME_W = 400
export const GAME_H = 600

export interface GameRuntime extends GameApi {
  /** Feed a direction from the on-screen d-pad. */
  emitDir(direction: Direction): void
  /** Stop the loop and detach all listeners WITHOUT reporting a score. */
  destroy(): void
}

interface RuntimeOptions {
  container: HTMLElement
  onDone(score: number): void
  onScore(score: number): void
}

/**
 * Creates the shared canvas runtime a game runs inside: a fixed 400x600
 * logical canvas, pointer tap/swipe + keyboard input, a delta-time RAF loop,
 * and a done() that reports the final score exactly once. Ported from the
 * original Mini Games engine (play.js).
 */
export function createGameRuntime({ container, onDone, onScore }: RuntimeOptions): GameRuntime {
  const canvas = document.createElement('canvas')
  canvas.width = GAME_W
  canvas.height = GAME_H
  canvas.className = 'block h-auto w-full'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  const dirCallbacks: Array<(direction: Direction) => void> = []
  const tapCallbacks: Array<(point: { x: number; y: number }) => void> = []
  const cleanups: Array<() => void> = []
  let raf = 0
  let ended = false

  function toLogical(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * GAME_W,
      y: ((clientY - rect.top) / rect.height) * GAME_H,
    }
  }

  const emitDir = (direction: Direction) => dirCallbacks.forEach((cb) => cb(direction))
  const emitTap = (point: { x: number; y: number }) => tapCallbacks.forEach((cb) => cb(point))

  // Pointer: short press = tap, longer drag = swipe direction.
  let down: { x: number; y: number } | null = null
  const onPointerDown = (event: PointerEvent) => {
    down = { x: event.clientX, y: event.clientY }
  }
  const onPointerUp = (event: PointerEvent) => {
    if (!down) {
      return
    }
    const dx = event.clientX - down.x
    const dy = event.clientY - down.y
    if (Math.hypot(dx, dy) < 24) {
      emitTap(toLogical(event.clientX, event.clientY))
    } else if (Math.abs(dx) > Math.abs(dy)) {
      emitDir(dx > 0 ? 'right' : 'left')
    } else {
      emitDir(dy > 0 ? 'down' : 'up')
    }
    down = null
  }
  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key
    if (key === ' ' || key === 'Spacebar') {
      event.preventDefault()
      emitTap({ x: GAME_W / 2, y: GAME_H / 2 })
    } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      event.preventDefault()
      emitDir('up')
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      event.preventDefault()
      emitDir('down')
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      emitDir('left')
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      emitDir('right')
    }
  }

  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointerup', onPointerUp)
  document.addEventListener('keydown', onKeyDown)

  function teardown() {
    cancelAnimationFrame(raf)
    container.removeEventListener('pointerdown', onPointerDown)
    container.removeEventListener('pointerup', onPointerUp)
    document.removeEventListener('keydown', onKeyDown)
    cleanups.forEach((fn) => {
      try {
        fn()
      } catch {
        // cleanup best-effort
      }
    })
    canvas.remove()
  }

  const runtime: GameRuntime = {
    canvas,
    ctx,
    W: GAME_W,
    H: GAME_H,
    onDir(callback) {
      dirCallbacks.push(callback)
    },
    onTap(callback) {
      tapCallbacks.push(callback)
    },
    addCleanup(fn) {
      cleanups.push(fn)
    },
    loop(fn) {
      let last = performance.now()
      const step = (now: number) => {
        if (ended) {
          return
        }
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        fn(dt)
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    },
    done(score) {
      if (ended) {
        return
      }
      ended = true
      teardown()
      onDone(Math.max(0, Math.round(score || 0)))
    },
    setScore(score) {
      onScore(Math.round(score))
    },
    emitDir,
    destroy() {
      if (ended) {
        return
      }
      ended = true
      teardown()
    },
  }

  return runtime
}
