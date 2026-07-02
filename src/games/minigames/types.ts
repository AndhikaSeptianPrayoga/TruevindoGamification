import type { MiniGameKey } from '@shared/types/minigames'

export type Direction = 'up' | 'down' | 'left' | 'right'

/** Runtime handed to each game's start(); owns the canvas, input, and loop. */
export interface GameApi {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  W: number
  H: number
  onDir(callback: (direction: Direction) => void): void
  onTap(callback: (point: { x: number; y: number }) => void): void
  addCleanup(fn: () => void): void
  loop(fn: (dt: number) => void): void
  done(score: number): void
  setScore(score: number): void
}

export interface GameDefinition {
  key: MiniGameKey
  name: string
  emoji: string
  needsDpad: boolean
  instructions: string
  start(api: GameApi): void
}
