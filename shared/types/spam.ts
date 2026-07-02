export type SpamGameStatus = 'waiting' | 'starting' | 'running' | 'ended'

export interface SpamPlayer {
  id: string
  name: string
  score: number
  rank: number
  connected: boolean
}

/** Full snapshot broadcast to every screen; timings are absolute server epochs. */
export interface SpamGameState {
  gameId: string
  status: SpamGameStatus
  title: string
  targets: string[]
  duration: number
  /** Epoch ms when the 3-2-1 countdown ends and play begins (null while waiting). */
  startsAt: number | null
  /** Epoch ms when the round ends (null while waiting). */
  endsAt: number | null
  /** Server clock at emit time — clients derive their clock offset from this. */
  serverNow: number
  playerCount: number
  connectedCount: number
  totalHits: number
  leaderboard: SpamPlayer[]
}

export interface SpamJoinResult {
  state: SpamGameState
  playerId: string
  name: string
  score: number
}

export interface SpamSubmitResult {
  ok: boolean
  reason?: 'not-joined' | 'not-running' | 'time-up' | 'mismatch' | 'too-fast'
  score?: number
  rank?: number
  of?: number
}

export interface SpamEndedPayload {
  reason: string
  winner: SpamPlayer | null
  leaderboard: SpamPlayer[]
  totalHits: number
}

export interface SpamConfigPayload {
  title?: string
  duration?: number
  targets?: string
}
