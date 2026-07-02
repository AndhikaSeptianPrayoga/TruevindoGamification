import type { Server } from 'socket.io'
import type {
  WheelAddEntryResult,
  WheelEntrySource,
  WheelJoinResult,
  WheelState,
} from '../../shared/types/wheel.js'
import { wheelService } from '../modules/wheel/wheel.service.js'

function roomOf(wheelId: string) {
  return `wheel:${wheelId}`
}

/**
 * Real-time Wheel of Names gateway. Fully independent from the quiz session
 * gateway — it shares the Socket.IO server but uses its own rooms and events,
 * so the live quiz flow is never affected.
 */
export function registerWheelGateway(io: Server) {
  function broadcastState(state: WheelState) {
    io.to(roomOf(state.wheelId)).emit('wheel:state', state)
  }

  io.on('connection', (socket) => {
    // Admin Control Room: get (or lazily create) the active wheel and join it.
    socket.on('wheel:ensure', (callback?: (state: WheelState) => void) => {
      const state = wheelService.ensureActiveWheel()
      socket.join(roomOf(state.wheelId))
      callback?.(state)
    })

    // Participant joins an existing wheel via the QR link. The response includes
    // this device's existing entry so a refreshed page restores its joined state.
    socket.on(
      'wheel:join',
      (
        { wheelId, deviceId }: { wheelId: string; deviceId?: string },
        callback?: (result: WheelJoinResult | { error: string }) => void,
      ) => {
        const state = wheelService.getWheel(wheelId)
        if (!state) {
          callback?.({ error: 'Wheel not found. Ask the host for a new QR code.' })
          return
        }
        socket.join(roomOf(wheelId))
        callback?.({ state, yourEntry: wheelService.getEntryForDevice(wheelId, deviceId) })
      },
    )

    socket.on(
      'wheel:add-entry',
      (
        {
          wheelId,
          name,
          source,
          deviceId,
        }: { wheelId: string; name: string; source: WheelEntrySource; deviceId?: string },
        callback?: (result: WheelAddEntryResult) => void,
      ) => {
        const result = wheelService.addEntry(
          wheelId,
          name ?? '',
          source === 'admin' ? 'admin' : 'participant',
          deviceId,
        )
        if (!('error' in result)) {
          broadcastState(result)
        }
        callback?.(result)
      },
    )

    socket.on(
      'wheel:remove-entry',
      (
        { wheelId, entryId }: { wheelId: string; entryId: string },
        callback?: (result: WheelState | { error: string }) => void,
      ) => {
        const result = wheelService.removeEntry(wheelId, entryId)
        if (!('error' in result)) {
          broadcastState(result)
        }
        callback?.(result)
      },
    )

    socket.on(
      'wheel:clear',
      ({ wheelId }: { wheelId: string }, callback?: (result: WheelState | { error: string }) => void) => {
        const result = wheelService.clearEntries(wheelId)
        if (!('error' in result)) {
          broadcastState(result)
        }
        callback?.(result)
      },
    )

    socket.on('wheel:new', (callback?: (state: WheelState) => void) => {
      const state = wheelService.resetActiveWheel()
      socket.join(roomOf(state.wheelId))
      callback?.(state)
    })

    socket.on(
      'wheel:spin',
      ({ wheelId }: { wheelId: string }, callback?: (result: { ok: true } | { error: string }) => void) => {
        const result = wheelService.startSpin(wheelId)
        if ('error' in result) {
          callback?.(result)
          return
        }

        // Everyone in the room receives the same winner + animation parameters,
        // so admin and participant screens spin in sync to the same result.
        io.to(roomOf(wheelId)).emit('wheel:spin', result.payload)
        broadcastState(result.state)

        setTimeout(() => {
          const done = wheelService.finishSpin(wheelId, result.payload.winnerId)
          if (done) {
            broadcastState(done)
          }
        }, result.payload.durationMs + 400)

        callback?.({ ok: true })
      },
    )
  })
}
