import type { Server, Socket } from 'socket.io'
import type { MiniGamesState } from '../../shared/types/minigames.js'
import { miniGamesService } from '../modules/minigames/minigames.service.js'

function roomOf(eventId: string) {
  return `mini:${eventId}`
}

/**
 * Real-time Mini Games gateway. Shares the Socket.IO server but uses its own
 * rooms/events ("mini:*"), so the quiz, wheel, and spam flows are untouched.
 * Scores stream in continuously, so state broadcasts are throttled to 200ms.
 */
export function registerMiniGamesGateway(io: Server) {
  const dirtyEvents = new Set<string>()

  setInterval(() => {
    for (const eventId of dirtyEvents) {
      dirtyEvents.delete(eventId)
      const state = miniGamesService.snapshotById(eventId)
      if (state) {
        io.to(roomOf(eventId)).emit('mini:state', state)
      }
    }
  }, 200)

  function broadcastState(state: MiniGamesState) {
    io.to(roomOf(state.eventId)).emit('mini:state', state)
  }

  io.on('connection', (socket: Socket) => {
    let joinedEventId: string | null = null
    let joinedPlayerId: string | null = null

    // Admin Control Room: get (or lazily create) the active event and join it.
    socket.on('mini:ensure', (callback?: (state: MiniGamesState) => void) => {
      const state = miniGamesService.ensureActiveEvent()
      socket.join(roomOf(state.eventId))
      callback?.(state)
    })

    socket.on(
      'mini:watch',
      ({ eventId }: { eventId: string }, callback?: (result: MiniGamesState | { error: string }) => void) => {
        const state = miniGamesService.getEvent(eventId)
        if (!state) {
          callback?.({ error: 'Event not found. Ask the host for a new QR code.' })
          return
        }
        socket.join(roomOf(eventId))
        callback?.(state)
      },
    )

    socket.on(
      'mini:event-name',
      ({ eventId, name }: { eventId: string; name: string }, callback?: (state?: MiniGamesState) => void) => {
        const state = miniGamesService.setEventName(eventId, name)
        if (state) {
          broadcastState(state)
        }
        callback?.(state)
      },
    )

    socket.on('mini:lock', ({ eventId, locked }: { eventId: string; locked: boolean }) => {
      const state = miniGamesService.setLocked(eventId, Boolean(locked))
      if (state) {
        broadcastState(state)
      }
    })

    socket.on(
      'mini:deadline',
      (
        { eventId, minutes }: { eventId: string; minutes: number | null },
        callback?: (result: MiniGamesState | { error: string }) => void,
      ) => {
        const result = miniGamesService.setDeadline(eventId, minutes)
        if (!('error' in result)) {
          broadcastState(result)
        }
        callback?.(result)
      },
    )

    socket.on('mini:reset', ({ eventId }: { eventId: string }) => {
      const state = miniGamesService.reset(eventId)
      if (state) {
        broadcastState(state)
        io.to(roomOf(eventId)).emit('mini:reset')
      }
    })

    socket.on('mini:kick', ({ eventId, playerId }: { eventId: string; playerId: string }) => {
      const state = miniGamesService.kick(eventId, playerId)
      if (state) {
        broadcastState(state)
        io.to(roomOf(eventId)).emit('mini:kicked', { playerId })
      }
    })

    socket.on(
      'mini:join',
      (
        {
          eventId,
          name,
          division,
          deviceId,
        }: { eventId: string; name: string; division: string; deviceId: string },
        callback?: (result: unknown) => void,
      ) => {
        if (!deviceId) {
          callback?.({ error: 'Missing device identity — reload the page.' })
          return
        }
        const result = miniGamesService.join(eventId, name, division, deviceId)
        if ('error' in result) {
          callback?.(result)
          return
        }
        joinedEventId = eventId
        joinedPlayerId = result.player.id
        socket.join(roomOf(eventId))
        broadcastState(result.state)
        callback?.({
          ok: true,
          playerId: result.player.id,
          name: result.player.name,
          division: result.player.division,
          total: Object.values(result.player.scores).reduce((sum, value) => sum + (value ?? 0), 0),
          state: result.state,
        })
      },
    )

    socket.on(
      'mini:score',
      (
        { eventId, game, score }: { eventId: string; game: string; score: number },
        callback?: (result: unknown) => void,
      ) => {
        if (!joinedPlayerId || joinedEventId !== eventId) {
          callback?.({ ok: false, reason: 'not-joined' })
          return
        }
        const result = miniGamesService.submitScore(eventId, joinedPlayerId, game, score)
        if (result.ok) {
          dirtyEvents.add(eventId)
        }
        callback?.(result)
      },
    )

    socket.on(
      'mini:finish',
      ({ eventId }: { eventId: string }, callback?: (result: unknown) => void) => {
        if (!joinedPlayerId || joinedEventId !== eventId) {
          callback?.({ ok: false })
          return
        }
        const result = miniGamesService.markFinished(eventId, joinedPlayerId)
        if (result) {
          dirtyEvents.add(eventId)
        }
        callback?.(result ? { ok: true, ...result } : { ok: false })
      },
    )

    socket.on('disconnect', () => {
      if (joinedEventId && joinedPlayerId) {
        if (miniGamesService.setConnected(joinedEventId, joinedPlayerId, false)) {
          dirtyEvents.add(joinedEventId)
        }
      }
    })
  })
}
