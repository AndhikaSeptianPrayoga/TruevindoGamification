import type { Server, Socket } from 'socket.io'
import type { SpamConfigPayload, SpamGameState } from '../../shared/types/spam.js'
import { SPAM_COUNTDOWN_MS, spamService } from '../modules/spam/spam.service.js'

function roomOf(gameId: string) {
  return `spam:${gameId}`
}

/**
 * Real-time Spamming Games gateway. Shares the Socket.IO server but uses its
 * own rooms/events ("spam:*"), so the quiz and wheel flows are never affected.
 * The server owns the round timeline: one absolute startsAt/endsAt is
 * broadcast and every client renders the countdown/timer against it using its
 * measured clock offset — admin and players stay in lock-step.
 */
export function registerSpamGateway(io: Server) {
  const startTimers = new Map<string, NodeJS.Timeout>()
  const endTimers = new Map<string, NodeJS.Timeout>()
  // Scores change many times per second; broadcast at most every 200ms.
  const dirtyGames = new Set<string>()

  setInterval(() => {
    for (const gameId of dirtyGames) {
      dirtyGames.delete(gameId)
      const state = spamService.snapshotById(gameId)
      if (state) {
        io.to(roomOf(gameId)).emit('spam:state', state)
      }
    }
  }, 200)

  function broadcastState(state: SpamGameState) {
    io.to(roomOf(state.gameId)).emit('spam:state', state)
  }

  function clearTimers(gameId: string) {
    const start = startTimers.get(gameId)
    if (start) {
      clearTimeout(start)
      startTimers.delete(gameId)
    }
    const end = endTimers.get(gameId)
    if (end) {
      clearTimeout(end)
      endTimers.delete(gameId)
    }
  }

  function endGame(gameId: string, reason: string) {
    const state = spamService.end(gameId, reason)
    if (!state) {
      return
    }
    clearTimers(gameId)
    broadcastState(state)
    const { winner, leaderboard, totalHits } = spamService.winnerOf(gameId)
    io.to(roomOf(gameId)).emit('spam:ended', { reason, winner, leaderboard, totalHits })
  }

  io.on('connection', (socket: Socket) => {
    let joinedGameId: string | null = null
    let joinedPlayerId: string | null = null

    // Admin Control Room: get (or lazily create) the active game and join it.
    socket.on('spam:ensure', (callback?: (state: SpamGameState) => void) => {
      const state = spamService.ensureActiveGame()
      socket.join(roomOf(state.gameId))
      callback?.(state)
    })

    socket.on(
      'spam:watch',
      ({ gameId }: { gameId: string }, callback?: (result: SpamGameState | { error: string }) => void) => {
        const state = spamService.getGame(gameId)
        if (!state) {
          callback?.({ error: 'Game not found. Ask the host for a new QR code.' })
          return
        }
        socket.join(roomOf(gameId))
        callback?.(state)
      },
    )

    socket.on(
      'spam:config',
      (
        { gameId, ...payload }: { gameId: string } & SpamConfigPayload,
        callback?: (result: SpamGameState | { error: string }) => void,
      ) => {
        const result = spamService.configure(gameId, payload)
        if (!('error' in result)) {
          broadcastState(result)
        }
        callback?.(result)
      },
    )

    socket.on(
      'spam:start',
      (
        { gameId, ...payload }: { gameId: string } & SpamConfigPayload,
        callback?: (result: SpamGameState | { error: string }) => void,
      ) => {
        const configured = spamService.configure(gameId, payload)
        if ('error' in configured) {
          callback?.(configured)
          return
        }
        const result = spamService.start(gameId)
        if ('error' in result) {
          callback?.(result)
          return
        }
        clearTimers(gameId)
        broadcastState(result.state)

        // Flip to the live round exactly when the countdown elapses…
        startTimers.set(
          gameId,
          setTimeout(() => {
            startTimers.delete(gameId)
            const running = spamService.markRunning(gameId)
            if (running) {
              broadcastState(running)
            }
          }, SPAM_COUNTDOWN_MS),
        )
        // …and end the round exactly when the duration elapses.
        endTimers.set(
          gameId,
          setTimeout(() => endGame(gameId, 'time'), result.endsAt - Date.now()),
        )
        callback?.(result.state)
      },
    )

    socket.on('spam:stop', ({ gameId }: { gameId: string }) => {
      endGame(gameId, 'stopped')
    })

    socket.on('spam:reset', ({ gameId }: { gameId: string }) => {
      clearTimers(gameId)
      const state = spamService.resetGame(gameId)
      if (state) {
        broadcastState(state)
        io.to(roomOf(gameId)).emit('spam:reset')
      }
    })

    socket.on('spam:reset-time', ({ gameId }: { gameId: string }) => {
      clearTimers(gameId)
      const state = spamService.resetTime(gameId)
      if (state) {
        broadcastState(state)
      }
    })

    socket.on('spam:kick', ({ gameId, playerId }: { gameId: string; playerId: string }) => {
      const state = spamService.kick(gameId, playerId)
      if (state) {
        broadcastState(state)
        io.to(roomOf(gameId)).emit('spam:kicked', { playerId })
      }
    })

    socket.on(
      'spam:join',
      (
        { gameId, name, deviceId }: { gameId: string; name: string; deviceId: string },
        callback?: (
          result:
            | { ok: true; playerId: string; name: string; score: number; state: SpamGameState }
            | { error: string },
        ) => void,
      ) => {
        if (!deviceId) {
          callback?.({ error: 'Missing device identity — reload the page.' })
          return
        }
        const result = spamService.join(gameId, name, deviceId)
        if ('error' in result) {
          callback?.(result)
          return
        }
        joinedGameId = gameId
        joinedPlayerId = result.player.id
        socket.join(roomOf(gameId))
        broadcastState(result.state)
        callback?.({
          ok: true,
          playerId: result.player.id,
          name: result.player.name,
          score: result.player.score,
          state: result.state,
        })
      },
    )

    socket.on(
      'spam:submit',
      ({ gameId, word }: { gameId: string; word: string }, callback?: (result: unknown) => void) => {
        if (!joinedPlayerId || joinedGameId !== gameId) {
          callback?.({ ok: false, reason: 'not-joined' })
          return
        }
        const result = spamService.submit(gameId, joinedPlayerId, word)
        if (result.ok) {
          dirtyGames.add(gameId)
        }
        callback?.(result)
      },
    )

    socket.on('disconnect', () => {
      if (joinedGameId && joinedPlayerId) {
        const state = spamService.setConnected(joinedGameId, joinedPlayerId, false)
        if (state) {
          dirtyGames.add(joinedGameId)
        }
      }
    })
  })
}
