import type {
  WheelAddEntryResult,
  WheelEntry,
  WheelEntrySource,
  WheelSpinPayload,
  WheelState,
} from '../../../shared/types/wheel.js'

const MAX_ENTRIES = 200
const MAX_NAME_LENGTH = 28
const SPIN_DURATION_MS = 6000

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * In-memory Wheel of Names sessions. The wheel is an ephemeral event tool, so
 * no database persistence is needed — one "active" wheel is kept for the admin
 * Control Room, and participants join it by id via the QR link.
 */
class WheelService {
  private wheels = new Map<string, WheelState>()
  private activeWheelId: string | null = null
  /** wheelId -> deviceId -> entryId. One participant entry per device per wheel. */
  private deviceIndex = new Map<string, Map<string, string>>()

  private deviceMapOf(wheelId: string) {
    let map = this.deviceIndex.get(wheelId)
    if (!map) {
      map = new Map<string, string>()
      this.deviceIndex.set(wheelId, map)
    }
    return map
  }

  /** The entry a given device already added (cleans up stale mappings). */
  getEntryForDevice(wheelId: string, deviceId?: string | null): WheelEntry | null {
    if (!deviceId) {
      return null
    }
    const wheel = this.wheels.get(wheelId)
    const map = this.deviceIndex.get(wheelId)
    const entryId = map?.get(deviceId)
    if (!wheel || !entryId) {
      return null
    }
    const entry = wheel.entries.find((item) => item.id === entryId) ?? null
    if (!entry) {
      // Entry was removed by the host — free the device to join again.
      map?.delete(deviceId)
    }
    return entry
  }

  private createWheel(): WheelState {
    const wheel: WheelState = {
      wheelId: generateId('wheel'),
      entries: [],
      isSpinning: false,
      lastWinner: null,
      totalSpins: 0,
    }
    this.wheels.set(wheel.wheelId, wheel)
    this.activeWheelId = wheel.wheelId
    return wheel
  }

  /** Return the current admin wheel, creating one on first use. */
  ensureActiveWheel(): WheelState {
    if (this.activeWheelId) {
      const existing = this.wheels.get(this.activeWheelId)
      if (existing) {
        return existing
      }
    }
    return this.createWheel()
  }

  /** Replace the active wheel with a fresh, empty one. */
  resetActiveWheel(): WheelState {
    if (this.activeWheelId) {
      this.wheels.delete(this.activeWheelId)
      this.deviceIndex.delete(this.activeWheelId)
    }
    return this.createWheel()
  }

  getWheel(wheelId: string): WheelState | undefined {
    return this.wheels.get(wheelId)
  }

  addEntry(
    wheelId: string,
    rawName: string,
    source: WheelEntrySource,
    deviceId?: string | null,
  ): WheelAddEntryResult {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) {
      return { error: 'Wheel not found. Ask the host for a new QR code.' }
    }
    if (wheel.isSpinning) {
      return { error: 'The wheel is spinning — try again in a few seconds.' }
    }

    // One entry per device: a refresh or QR re-scan cannot add a second name.
    // (Host-added names are exempt — the host manages the list manually.)
    if (source === 'participant') {
      const existing = this.getEntryForDevice(wheelId, deviceId)
      if (existing) {
        return {
          error: `This device already put "${existing.name}" on the wheel.`,
          yourEntry: existing,
        }
      }
    }

    const name = rawName.trim().slice(0, MAX_NAME_LENGTH)
    if (!name) {
      return { error: 'Name cannot be empty.' }
    }
    if (wheel.entries.length >= MAX_ENTRIES) {
      return { error: `The wheel is full (${MAX_ENTRIES} names max).` }
    }
    if (wheel.entries.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) {
      return { error: `"${name}" is already on the wheel.` }
    }

    const entry: WheelEntry = { id: generateId('entry'), name, source }
    wheel.entries.push(entry)
    if (source === 'participant' && deviceId) {
      this.deviceMapOf(wheelId).set(deviceId, entry.id)
    }
    return wheel
  }

  removeEntry(wheelId: string, entryId: string): WheelState | { error: string } {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) {
      return { error: 'Wheel not found.' }
    }
    if (wheel.isSpinning) {
      return { error: 'Cannot edit names while the wheel is spinning.' }
    }
    wheel.entries = wheel.entries.filter((entry) => entry.id !== entryId)
    // Free the device slot so a removed participant may join again.
    const deviceMap = this.deviceIndex.get(wheelId)
    if (deviceMap) {
      for (const [device, mappedEntryId] of deviceMap.entries()) {
        if (mappedEntryId === entryId) {
          deviceMap.delete(device)
        }
      }
    }
    return wheel
  }

  clearEntries(wheelId: string): WheelState | { error: string } {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) {
      return { error: 'Wheel not found.' }
    }
    if (wheel.isSpinning) {
      return { error: 'Cannot clear names while the wheel is spinning.' }
    }
    wheel.entries = []
    wheel.lastWinner = null
    this.deviceIndex.delete(wheelId)
    return wheel
  }

  startSpin(wheelId: string): { state: WheelState; payload: WheelSpinPayload } | { error: string } {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) {
      return { error: 'Wheel not found.' }
    }
    if (wheel.isSpinning) {
      return { error: 'The wheel is already spinning.' }
    }
    if (wheel.entries.length < 2) {
      return { error: 'Add at least 2 names before spinning.' }
    }

    const winnerIndex = Math.floor(Math.random() * wheel.entries.length)
    const winner = wheel.entries[winnerIndex]
    wheel.isSpinning = true
    wheel.lastWinner = null
    wheel.totalSpins += 1

    return {
      state: wheel,
      payload: {
        spinId: wheel.totalSpins,
        winnerId: winner.id,
        winnerIndex,
        extraSpins: 5 + Math.floor(Math.random() * 3),
        durationMs: SPIN_DURATION_MS,
      },
    }
  }

  finishSpin(wheelId: string, winnerId: string): WheelState | undefined {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) {
      return undefined
    }
    wheel.isSpinning = false
    wheel.lastWinner = wheel.entries.find((entry) => entry.id === winnerId) ?? null
    return wheel
  }
}

export const wheelService = new WheelService()
