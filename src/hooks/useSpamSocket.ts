import { useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import type {
  SpamConfigPayload,
  SpamEndedPayload,
  SpamGameState,
  SpamSubmitResult,
} from '@shared/types/spam'
import { getDeviceId } from '@/utils/device'

interface UseSpamSocketOptions {
  /** Required for players; ignored for the admin (the server resolves the active game). */
  gameId?: string | null
  role: 'admin' | 'player'
  onState?: (state: SpamGameState) => void
  onEnded?: (payload: SpamEndedPayload) => void
  /** Admin performed a full reset — players should return to the join screen. */
  onReset?: () => void
  onKicked?: (playerId: string) => void
  onError?: (message: string) => void
}

type JoinAck =
  | { ok: true; playerId: string; name: string; score: number; state: SpamGameState }
  | { error: string }

export function useSpamSocket({
  gameId,
  role,
  onState,
  onEnded,
  onReset,
  onKicked,
  onError,
}: UseSpamSocketOptions) {
  const onStateRef = useRef(onState)
  const onEndedRef = useRef(onEnded)
  const onResetRef = useRef(onReset)
  const onKickedRef = useRef(onKicked)
  const onErrorRef = useRef(onError)
  const gameIdRef = useRef<string | null>(gameId ?? null)
  const deviceId = useMemo(getDeviceId, [])

  useEffect(() => {
    onStateRef.current = onState
    onEndedRef.current = onEnded
    onResetRef.current = onReset
    onKickedRef.current = onKicked
    onErrorRef.current = onError
  }, [onState, onEnded, onReset, onKicked, onError])

  const socket = useMemo(
    () =>
      io('/', {
        autoConnect: false,
        transports: ['websocket'],
      }),
    [],
  )

  useEffect(() => {
    const handleState = (state: SpamGameState) => {
      gameIdRef.current = state.gameId
      onStateRef.current?.(state)
    }
    const handleEnded = (payload: SpamEndedPayload) => onEndedRef.current?.(payload)
    const handleReset = () => onResetRef.current?.()
    const handleKicked = ({ playerId }: { playerId: string }) => onKickedRef.current?.(playerId)

    socket.connect()
    socket.on('spam:state', handleState)
    socket.on('spam:ended', handleEnded)
    socket.on('spam:reset', handleReset)
    socket.on('spam:kicked', handleKicked)

    if (role === 'admin') {
      socket.emit('spam:ensure', handleState)
    } else if (gameId) {
      socket.emit('spam:watch', { gameId }, (result: SpamGameState | { error: string }) => {
        if ('error' in result) {
          onErrorRef.current?.(result.error)
          return
        }
        handleState(result)
      })
    }

    return () => {
      socket.off('spam:state', handleState)
      socket.off('spam:ended', handleEnded)
      socket.off('spam:reset', handleReset)
      socket.off('spam:kicked', handleKicked)
      socket.disconnect()
    }
  }, [gameId, role, socket])

  function withGame<T>(emit: (currentGameId: string) => T) {
    const current = gameIdRef.current
    if (!current) {
      onErrorRef.current?.('Game is not ready yet.')
      return
    }
    return emit(current)
  }

  return {
    deviceId,
    configure: (payload: SpamConfigPayload) =>
      new Promise<SpamGameState | { error: string }>((resolve) => {
        withGame((id) => socket.emit('spam:config', { gameId: id, ...payload }, resolve))
      }),
    start: (payload: SpamConfigPayload) =>
      new Promise<SpamGameState | { error: string }>((resolve) => {
        withGame((id) => socket.emit('spam:start', { gameId: id, ...payload }, resolve))
      }),
    stop: () => withGame((id) => socket.emit('spam:stop', { gameId: id })),
    resetGame: () => withGame((id) => socket.emit('spam:reset', { gameId: id })),
    resetTime: () => withGame((id) => socket.emit('spam:reset-time', { gameId: id })),
    kick: (playerId: string) => withGame((id) => socket.emit('spam:kick', { gameId: id, playerId })),
    join: (name: string) =>
      new Promise<JoinAck>((resolve) => {
        withGame((id) => socket.emit('spam:join', { gameId: id, name, deviceId }, resolve))
      }),
    submit: (word: string) =>
      new Promise<SpamSubmitResult>((resolve) => {
        withGame((id) => socket.emit('spam:submit', { gameId: id, word }, resolve))
      }),
  }
}
