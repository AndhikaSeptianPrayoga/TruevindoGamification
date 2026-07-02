import type { MiniGameKey } from '@shared/types/minigames'
import type { GameDefinition } from './types'
import { flappy } from './games/flappy'
import { maze } from './games/maze'
import { puzzle } from './games/puzzle'
import { runner } from './games/runner'
import { snake } from './games/snake'

export const MINI_GAMES: Record<MiniGameKey, GameDefinition> = {
  flappy,
  puzzle,
  snake,
  maze,
  runner,
}

export const MINI_GAME_LIST = Object.values(MINI_GAMES)

/** Pick a random game key, avoiding an immediate repeat when possible. */
export function pickNextGame(lastKey: MiniGameKey | null): MiniGameKey {
  const keys = Object.keys(MINI_GAMES) as MiniGameKey[]
  const pool = keys.length > 1 && lastKey ? keys.filter((key) => key !== lastKey) : keys
  return pool[Math.floor(Math.random() * pool.length)]
}
