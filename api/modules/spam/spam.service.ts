import type {
  SpamConfigPayload,
  SpamGameState,
  SpamPlayer,
  SpamSubmitResult,
} from '../../../shared/types/spam.js'

export const SPAM_COUNTDOWN_MS = 3000
const DEFAULT_TARGETS = ['truevindo']
const MAX_TARGETS = 20
const MAX_PLAYERS = 300
/**
 * Minimum ms between two valid hits from one player. Typing a full target word
 * takes a human well over this — it only blocks automated spam submissions.
 */
const MIN_HIT_INTERVAL_MS = 90

interface InternalPlayer {
  id: string
  name: string
  score: number
  lastHit: number
  lastScoredAt: number
  connected: boolean
}

interface SpamGame {
  gameId: string
  status: SpamGameState['status']
  title: string
  targets: string[]
  duration: number
  startsAt: number | null
  endsAt: number | null
  players: Map<string, InternalPlayer>
}

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

/** Normalize admin-entered spam words: comma/newline separated, deduped, capped. */
function parseTargets(input: string | undefined): string[] {
  const words = String(input ?? '')
    .split(/[,\n]/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean)
    .map((word) => word.slice(0, 40))
  const unique = [...new Set(words)].slice(0, MAX_TARGETS)
  return unique.length ? unique : [...DEFAULT_TARGETS]
}

/**
 * In-memory Spamming Games sessions — one active game for the Control Room,
 * fully independent from the quiz and wheel state. The server owns the round
 * timeline (startsAt/endsAt) and validates every hit, so clients can't cheat.
 */
class SpamService {
  private games = new Map<string, SpamGame>()
  private activeGameId: string | null = null

  private createGame(): SpamGame {
    const game: SpamGame = {
      gameId: generateId('spam'),
      status: 'waiting',
      title: 'Truevindo Spam Challenge',
      targets: [...DEFAULT_TARGETS],
      duration: 60,
      startsAt: null,
      endsAt: null,
      players: new Map(),
    }
    this.games.set(game.gameId, game)
    this.activeGameId = game.gameId
    return game
  }

  ensureActiveGame(): SpamGameState {
    if (this.activeGameId) {
      const existing = this.games.get(this.activeGameId)
      if (existing) {
        return this.snapshot(existing)
      }
    }
    return this.snapshot(this.createGame())
  }

  getGame(gameId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    return game ? this.snapshot(game) : undefined
  }

  private leaderboardOf(game: SpamGame): SpamPlayer[] {
    return [...game.players.values()]
      .sort((a, b) => b.score - a.score || a.lastScoredAt - b.lastScoredAt)
      .map((player, index) => ({
        id: player.id,
        name: player.name,
        score: player.score,
        connected: player.connected,
        rank: index + 1,
      }))
  }

  private totalHitsOf(game: SpamGame): number {
    let total = 0
    for (const player of game.players.values()) {
      total += player.score
    }
    return total
  }

  snapshot(game: SpamGame): SpamGameState {
    return {
      gameId: game.gameId,
      status: game.status,
      title: game.title,
      targets: game.targets,
      duration: game.duration,
      startsAt: game.startsAt,
      endsAt: game.endsAt,
      serverNow: Date.now(),
      playerCount: game.players.size,
      connectedCount: [...game.players.values()].filter((p) => p.connected).length,
      totalHits: this.totalHitsOf(game),
      leaderboard: this.leaderboardOf(game),
    }
  }

  snapshotById(gameId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    return game ? this.snapshot(game) : undefined
  }

  configure(gameId: string, payload: SpamConfigPayload): SpamGameState | { error: string } {
    const game = this.games.get(gameId)
    if (!game) {
      return { error: 'Game not found.' }
    }
    if (game.status === 'running' || game.status === 'starting') {
      return { error: 'Settings are locked while a round is underway.' }
    }
    if (typeof payload.title === 'string' && payload.title.trim()) {
      game.title = payload.title.trim().slice(0, 80)
    }
    if (payload.targets !== undefined) {
      game.targets = parseTargets(payload.targets)
    }
    const duration = Number(payload.duration)
    if (Number.isFinite(duration) && duration >= 10 && duration <= 3600) {
      game.duration = Math.round(duration)
    }
    return this.snapshot(game)
  }

  /** Begin the synchronized countdown; scores reset, players stay joined. */
  start(gameId: string): { state: SpamGameState; startsAt: number; endsAt: number } | { error: string } {
    const game = this.games.get(gameId)
    if (!game) {
      return { error: 'Game not found.' }
    }
    if (game.status === 'running' || game.status === 'starting') {
      return { error: 'A round is already underway.' }
    }
    for (const player of game.players.values()) {
      player.score = 0
      player.lastHit = 0
      player.lastScoredAt = 0
    }
    const now = Date.now()
    game.status = 'starting'
    game.startsAt = now + SPAM_COUNTDOWN_MS
    game.endsAt = game.startsAt + game.duration * 1000
    return { state: this.snapshot(game), startsAt: game.startsAt, endsAt: game.endsAt }
  }

  markRunning(gameId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    if (!game || game.status !== 'starting') {
      return undefined
    }
    game.status = 'running'
    return this.snapshot(game)
  }

  end(gameId: string, _reason: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    if (!game || (game.status !== 'running' && game.status !== 'starting')) {
      return undefined
    }
    game.status = 'ended'
    game.endsAt = Date.now()
    return this.snapshot(game)
  }

  /** Full wipe: removes every player and returns to the start screen. */
  resetGame(gameId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    if (!game) {
      return undefined
    }
    game.status = 'waiting'
    game.startsAt = null
    game.endsAt = null
    game.players.clear()
    return this.snapshot(game)
  }

  /** Timer-only reset: stops the round but KEEPS players and their scores. */
  resetTime(gameId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    if (!game) {
      return undefined
    }
    game.status = 'waiting'
    game.startsAt = null
    game.endsAt = null
    return this.snapshot(game)
  }

  /**
   * Join (or re-join) as a player. The stable deviceId is the player identity,
   * so a refresh reconnects as the same player with the score preserved instead
   * of creating a duplicate entry.
   */
  join(
    gameId: string,
    rawName: string,
    deviceId: string,
  ): { state: SpamGameState; player: InternalPlayer } | { error: string } {
    const game = this.games.get(gameId)
    if (!game) {
      return { error: 'Game not found. Ask the host for a new QR code.' }
    }
    const name = String(rawName || '').trim().slice(0, 24) || 'Anonymous'
    const playerId = `sp-${deviceId}`

    let player = game.players.get(playerId)
    if (player) {
      player.name = name
      player.connected = true
    } else {
      if (game.players.size >= MAX_PLAYERS) {
        return { error: `The game is full (${MAX_PLAYERS} players max).` }
      }
      player = { id: playerId, name, score: 0, lastHit: 0, lastScoredAt: 0, connected: true }
      game.players.set(playerId, player)
    }
    return { state: this.snapshot(game), player }
  }

  submit(gameId: string, playerId: string, rawWord: string): SpamSubmitResult {
    const game = this.games.get(gameId)
    const player = game?.players.get(playerId)
    if (!game || !player) {
      return { ok: false, reason: 'not-joined' }
    }
    if (game.status !== 'running') {
      return { ok: false, reason: 'not-running' }
    }
    const now = Date.now()
    if (game.endsAt && now > game.endsAt) {
      return { ok: false, reason: 'time-up' }
    }
    const word = String(rawWord || '').trim().toLowerCase()
    if (!game.targets.includes(word)) {
      return { ok: false, reason: 'mismatch' }
    }
    if (now - player.lastHit < MIN_HIT_INTERVAL_MS) {
      return { ok: false, reason: 'too-fast', score: player.score }
    }

    player.lastHit = now
    player.score += 1
    player.lastScoredAt = now

    const board = this.leaderboardOf(game)
    const me = board.find((entry) => entry.id === playerId)
    return { ok: true, score: player.score, rank: me?.rank, of: board.length }
  }

  kick(gameId: string, playerId: string): SpamGameState | undefined {
    const game = this.games.get(gameId)
    if (!game || !game.players.delete(playerId)) {
      return undefined
    }
    return this.snapshot(game)
  }

  setConnected(gameId: string, playerId: string, connected: boolean): SpamGameState | undefined {
    const game = this.games.get(gameId)
    const player = game?.players.get(playerId)
    if (!game || !player) {
      return undefined
    }
    player.connected = connected
    return this.snapshot(game)
  }

  winnerOf(gameId: string): { winner: SpamPlayer | null; leaderboard: SpamPlayer[]; totalHits: number } {
    const game = this.games.get(gameId)
    if (!game) {
      return { winner: null, leaderboard: [], totalHits: 0 }
    }
    const board = this.leaderboardOf(game)
    return { winner: board[0] ?? null, leaderboard: board, totalHits: this.totalHitsOf(game) }
  }
}

export const spamService = new SpamService()
