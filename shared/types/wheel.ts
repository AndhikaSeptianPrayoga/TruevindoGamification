export type WheelEntrySource = 'admin' | 'participant'

export interface WheelEntry {
  id: string
  name: string
  source: WheelEntrySource
}

/** Broadcast when a spin starts; every client animates to the same winner. */
export interface WheelSpinPayload {
  spinId: number
  winnerId: string
  winnerIndex: number
  extraSpins: number
  durationMs: number
}

export interface WheelState {
  wheelId: string
  entries: WheelEntry[]
  isSpinning: boolean
  lastWinner: WheelEntry | null
  totalSpins: number
}

export interface WheelActionError {
  error: string
}
