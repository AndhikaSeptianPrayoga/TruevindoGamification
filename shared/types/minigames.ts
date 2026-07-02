export const MINI_GAME_KEYS = ['flappy', 'puzzle', 'snake', 'maze', 'runner'] as const
export type MiniGameKey = (typeof MINI_GAME_KEYS)[number]

export interface MiniGamesPlayer {
  id: string
  name: string
  division: string
  /** Accumulated score per game type (endless play adds every round). */
  scores: Partial<Record<MiniGameKey, number>>
  total: number
  rounds: number
  rank: number
  connected: boolean
  finished: boolean
}

/** Full event snapshot broadcast to every screen. */
export interface MiniGamesState {
  eventId: string
  eventName: string
  /** Registration closed by the admin — new players cannot join. */
  locked: boolean
  /** Epoch ms deadline set by the admin (null = no time limit). */
  endsAt: number | null
  ended: boolean
  serverNow: number
  playerCount: number
  connectedCount: number
  totalRounds: number
  leaderboard: MiniGamesPlayer[]
}

export interface MiniGamesJoinAck {
  ok: true
  playerId: string
  name: string
  division: string
  total: number
  state: MiniGamesState
}

export interface MiniGamesScoreAck {
  ok: boolean
  reason?: 'not-joined' | 'event-ended' | 'bad-game'
  total?: number
  rank?: number
  of?: number
}
