import { useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import type {
  MiniGamesJoinAck,
  MiniGamesScoreAck,
  MiniGamesState,
} from '@shared/types/minigames'
import { getDeviceId } from '@/utils/device'

interface UseMiniGamesSocketOptions {
  /** Required for players; ignored for the admin (the server resolves the active event). */
  eventId?: string | null
  role: 'admin' | 'player'
  onState?: (state: MiniGamesState) => void
  /** Admin performed a full reset — players return to the join screen. */
  onReset?: () => void
  onKicked?: (playerId: string) => void
  onError?: (message: string) => void
}

export function useMiniGamesSocket({
  eventId,
  role,
  onState,
  onReset,
  onKicked,
  onError,
}: UseMiniGamesSocketOptions) {
  const onStateRef = useRef(onState)
  const onResetRef = useRef(onReset)
  const onKickedRef = useRef(onKicked)
  const onErrorRef = useRef(onError)
  const eventIdRef = useRef<string | null>(eventId ?? null)
  const deviceId = useMemo(getDeviceId, [])

  useEffect(() => {
    onStateRef.current = onState
    onResetRef.current = onReset
    onKickedRef.current = onKicked
    onErrorRef.current = onError
  }, [onState, onReset, onKicked, onError])

  const socket = useMemo(
    () =>
      io('/', {
        autoConnect: false,
        transports: ['websocket'],
      }),
    [],
  )

  useEffect(() => {
    const handleState = (state: MiniGamesState) => {
      eventIdRef.current = state.eventId
      onStateRef.current?.(state)
    }
    const handleReset = () => onResetRef.current?.()
    const handleKicked = ({ playerId }: { playerId: string }) => onKickedRef.current?.(playerId)

    socket.connect()
    socket.on('mini:state', handleState)
    socket.on('mini:reset', handleReset)
    socket.on('mini:kicked', handleKicked)

    if (role === 'admin') {
      socket.emit('mini:ensure', handleState)
    } else if (eventId) {
      socket.emit('mini:watch', { eventId }, (result: MiniGamesState | { error: string }) => {
        if ('error' in result) {
          onErrorRef.current?.(result.error)
          return
        }
        handleState(result)
      })
    }

    return () => {
      socket.off('mini:state', handleState)
      socket.off('mini:reset', handleReset)
      socket.off('mini:kicked', handleKicked)
      socket.disconnect()
    }
  }, [eventId, role, socket])

  function withEvent<T>(emit: (currentEventId: string) => T) {
    const current = eventIdRef.current
    if (!current) {
      onErrorRef.current?.('Event is not ready yet.')
      return
    }
    return emit(current)
  }

  return {
    deviceId,
    join: (name: string, division: string) =>
      new Promise<MiniGamesJoinAck | { error: string }>((resolve) => {
        withEvent((id) => socket.emit('mini:join', { eventId: id, name, division, deviceId }, resolve))
      }),
    submitScore: (game: string, score: number) =>
      new Promise<MiniGamesScoreAck>((resolve) => {
        withEvent((id) => socket.emit('mini:score', { eventId: id, game, score }, resolve))
      }),
    finish: () =>
      new Promise<{ ok: boolean; total?: number; rank?: number; of?: number }>((resolve) => {
        withEvent((id) => socket.emit('mini:finish', { eventId: id }, resolve))
      }),
    setEventName: (name: string) => withEvent((id) => socket.emit('mini:event-name', { eventId: id, name })),
    setLocked: (locked: boolean) => withEvent((id) => socket.emit('mini:lock', { eventId: id, locked })),
    setDeadline: (minutes: number | null) =>
      new Promise<MiniGamesState | { error: string }>((resolve) => {
        withEvent((id) => socket.emit('mini:deadline', { eventId: id, minutes }, resolve))
      }),
    reset: () => withEvent((id) => socket.emit('mini:reset', { eventId: id })),
    kick: (playerId: string) => withEvent((id) => socket.emit('mini:kick', { eventId: id, playerId })),
  }
}
