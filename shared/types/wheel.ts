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

/** wheel:join response — includes this device's existing entry, if any. */
export interface WheelJoinResult {
  state: WheelState
  yourEntry: WheelEntry | null
}

/** wheel:add-entry response; on "already joined" the existing entry is returned. */
export type WheelAddEntryResult = WheelState | { error: string; yourEntry?: WheelEntry }
