import {
  MINI_GAME_KEYS,
  type MiniGameKey,
  type MiniGamesPlayer,
  type MiniGamesState,
} from '../../../shared/types/minigames.js'

const MAX_PLAYERS = 500
const MAX_SCORE_PER_ROUND = 1_000_000

interface InternalPlayer {
  id: string
  name: string
  division: string
  scores: Partial<Record<MiniGameKey, number>>
  rounds: number
  connected: boolean
  finished: boolean
  createdAt: number
}

interface MiniGamesEvent {
  eventId: string
  eventName: string
  locked: boolean
  endsAt: number | null
  players: Map<string, InternalPlayer>
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function totalOf(player: InternalPlayer): number {
  return MINI_GAME_KEYS.reduce((sum, key) => sum + (player.scores[key] ?? 0), 0)
}

/**
 * In-memory Mini Games event — one active event for the Control Room, fully
 * independent from the quiz/wheel/spam state. Players rotate through the five
 * canvas games in random order client-side; every round's score is accumulated
 * server-side into one combined leaderboard total.
 */
class MiniGamesService {
  private events = new Map<string, MiniGamesEvent>()
  private activeEventId: string | null = null

  private createEvent(): MiniGamesEvent {
    const event: MiniGamesEvent = {
      eventId: generateId('mini'),
      eventName: 'Truevindo Mini Games',
      locked: false,
      endsAt: null,
      players: new Map(),
    }
    this.events.set(event.eventId, event)
    this.activeEventId = event.eventId
    return event
  }

  ensureActiveEvent(): MiniGamesState {
    if (this.activeEventId) {
      const existing = this.events.get(this.activeEventId)
      if (existing) {
        return this.snapshot(existing)
      }
    }
    return this.snapshot(this.createEvent())
  }

  getEvent(eventId: string): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    return event ? this.snapshot(event) : undefined
  }

  private isEnded(event: MiniGamesEvent): boolean {
    return Boolean(event.endsAt && Date.now() >= event.endsAt)
  }

  private leaderboardOf(event: MiniGamesEvent): MiniGamesPlayer[] {
    return [...event.players.values()]
      .map((player) => ({
        id: player.id,
        name: player.name,
        division: player.division,
        scores: player.scores,
        total: totalOf(player),
        rounds: player.rounds,
        connected: player.connected,
        finished: player.finished,
        rank: 0,
      }))
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      .map((player, index) => ({ ...player, rank: index + 1 }))
  }

  snapshot(event: MiniGamesEvent): MiniGamesState {
    const leaderboard = this.leaderboardOf(event)
    return {
      eventId: event.eventId,
      eventName: event.eventName,
      locked: event.locked,
      endsAt: event.endsAt,
      ended: this.isEnded(event),
      serverNow: Date.now(),
      playerCount: event.players.size,
      connectedCount: [...event.players.values()].filter((p) => p.connected).length,
      totalRounds: [...event.players.values()].reduce((sum, p) => sum + p.rounds, 0),
      leaderboard,
    }
  }

  snapshotById(eventId: string): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    return event ? this.snapshot(event) : undefined
  }

  setEventName(eventId: string, rawName: string): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    if (!event) {
      return undefined
    }
    const name = String(rawName || '').trim().slice(0, 60)
    if (name) {
      event.eventName = name
    }
    return this.snapshot(event)
  }

  setLocked(eventId: string, locked: boolean): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    if (!event) {
      return undefined
    }
    event.locked = locked
    return this.snapshot(event)
  }

  /** Set the deadline N minutes from now, or clear it. */
  setDeadline(eventId: string, minutes: number | null): MiniGamesState | { error: string } {
    const event = this.events.get(eventId)
    if (!event) {
      return { error: 'Event not found.' }
    }
    if (minutes === null) {
      event.endsAt = null
    } else {
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) {
        return { error: 'Duration must be between 1 minute and 24 hours.' }
      }
      event.endsAt = Date.now() + Math.round(minutes * 60_000)
    }
    return this.snapshot(event)
  }

  /** Wipe every player and reopen the event. */
  reset(eventId: string): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    if (!event) {
      return undefined
    }
    event.players.clear()
    event.locked = false
    event.endsAt = null
    return this.snapshot(event)
  }

  /**
   * Join (or resume) as a player. The stable deviceId is the identity, so a
   * refresh reconnects as the same player with the running total preserved.
   */
  join(
    eventId: string,
    rawName: string,
    rawDivision: string,
    deviceId: string,
  ): { state: MiniGamesState; player: InternalPlayer } | { error: string } {
    const event = this.events.get(eventId)
    if (!event) {
      return { error: 'Event not found. Ask the host for a new QR code.' }
    }
    if (this.isEnded(event)) {
      return { error: 'This event has ended — check the leaderboard on the big screen!' }
    }
    const playerId = `mg-${deviceId}`
    let player = event.players.get(playerId)

    if (player) {
      // Returning device — keep the accumulated scores.
      const name = String(rawName || '').trim().slice(0, 40)
      if (name) {
        player.name = name
      }
      player.connected = true
    } else {
      if (event.locked) {
        return { error: 'Registration is closed for this event.' }
      }
      if (event.players.size >= MAX_PLAYERS) {
        return { error: `The event is full (${MAX_PLAYERS} players max).` }
      }
      const name = String(rawName || '').trim().slice(0, 40)
      if (!name) {
        return { error: 'Name cannot be empty.' }
      }
      player = {
        id: playerId,
        name,
        division: String(rawDivision || '').trim().slice(0, 40) || 'General',
        scores: {},
        rounds: 0,
        connected: true,
        finished: false,
        createdAt: Date.now(),
      }
      event.players.set(playerId, player)
    }
    return { state: this.snapshot(event), player }
  }

  /** Accumulate one round's score into the player's running total. */
  submitScore(
    eventId: string,
    playerId: string,
    game: string,
    rawScore: number,
  ): { ok: true; total: number; rank: number; of: number } | { ok: false; reason: 'not-joined' | 'event-ended' | 'bad-game' } {
    const event = this.events.get(eventId)
    const player = event?.players.get(playerId)
    if (!event || !player) {
      return { ok: false, reason: 'not-joined' }
    }
    if (this.isEnded(event)) {
      return { ok: false, reason: 'event-ended' }
    }
    if (!MINI_GAME_KEYS.includes(game as MiniGameKey)) {
      return { ok: false, reason: 'bad-game' }
    }
    const key = game as MiniGameKey
    let score = Number(rawScore)
    if (!Number.isFinite(score) || score < 0) {
      score = 0
    }
    score = Math.min(Math.round(score), MAX_SCORE_PER_ROUND)

    player.scores[key] = (player.scores[key] ?? 0) + score
    player.rounds += 1

    const board = this.leaderboardOf(event)
    const me = board.find((entry) => entry.id === playerId)
    return { ok: true, total: totalOf(player), rank: me?.rank ?? board.length, of: board.length }
  }

  markFinished(eventId: string, playerId: string): { total: number; rank: number; of: number } | undefined {
    const event = this.events.get(eventId)
    const player = event?.players.get(playerId)
    if (!event || !player) {
      return undefined
    }
    player.finished = true
    const board = this.leaderboardOf(event)
    const me = board.find((entry) => entry.id === playerId)
    return { total: totalOf(player), rank: me?.rank ?? board.length, of: board.length }
  }

  kick(eventId: string, playerId: string): MiniGamesState | undefined {
    const event = this.events.get(eventId)
    if (!event || !event.players.delete(playerId)) {
      return undefined
    }
    return this.snapshot(event)
  }

  setConnected(eventId: string, playerId: string, connected: boolean): boolean {
    const player = this.events.get(eventId)?.players.get(playerId)
    if (!player) {
      return false
    }
    player.connected = connected
    return true
  }
}

export const miniGamesService = new MiniGamesService()
