import { useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import type {
  WheelEntrySource,
  WheelSpinPayload,
  WheelState,
} from '@shared/types/wheel'

interface UseWheelSocketOptions {
  /** Required for participants; ignored for the admin (the server resolves the active wheel). */
  wheelId?: string | null
  role: 'admin' | 'participant'
  onState?: (state: WheelState) => void
  onSpin?: (payload: WheelSpinPayload) => void
  onError?: (message: string) => void
}

type WheelResult = WheelState | { error: string }

export function useWheelSocket({ wheelId, role, onState, onSpin, onError }: UseWheelSocketOptions) {
  const onStateRef = useRef(onState)
  const onSpinRef = useRef(onSpin)
  const onErrorRef = useRef(onError)
  const wheelIdRef = useRef<string | null>(wheelId ?? null)

  useEffect(() => {
    onStateRef.current = onState
    onSpinRef.current = onSpin
    onErrorRef.current = onError
  }, [onState, onSpin, onError])

  const socket = useMemo(
    () =>
      io('/', {
        autoConnect: false,
        transports: ['websocket'],
      }),
    [],
  )

  useEffect(() => {
    const handleState = (state: WheelState) => {
      wheelIdRef.current = state.wheelId
      onStateRef.current?.(state)
    }
    const handleSpin = (payload: WheelSpinPayload) => {
      onSpinRef.current?.(payload)
    }

    socket.connect()
    socket.on('wheel:state', handleState)
    socket.on('wheel:spin', handleSpin)

    if (role === 'admin') {
      socket.emit('wheel:ensure', handleState)
    } else if (wheelId) {
      socket.emit('wheel:join', { wheelId }, (result: WheelResult) => {
        if ('error' in result) {
          onErrorRef.current?.(result.error)
          return
        }
        handleState(result)
      })
    }

    return () => {
      socket.off('wheel:state', handleState)
      socket.off('wheel:spin', handleSpin)
      socket.disconnect()
    }
  }, [role, socket, wheelId])

  function withWheel<T>(emit: (currentWheelId: string) => T) {
    const current = wheelIdRef.current
    if (!current) {
      onErrorRef.current?.('Wheel is not ready yet.')
      return
    }
    return emit(current)
  }

  return {
    addEntry: (name: string, source: WheelEntrySource) =>
      new Promise<WheelResult>((resolve) => {
        withWheel((id) => socket.emit('wheel:add-entry', { wheelId: id, name, source }, resolve))
      }),
    removeEntry: (entryId: string) =>
      new Promise<WheelResult>((resolve) => {
        withWheel((id) => socket.emit('wheel:remove-entry', { wheelId: id, entryId }, resolve))
      }),
    clearEntries: () =>
      new Promise<WheelResult>((resolve) => {
        withWheel((id) => socket.emit('wheel:clear', { wheelId: id }, resolve))
      }),
    spin: () =>
      new Promise<{ ok: true } | { error: string }>((resolve) => {
        withWheel((id) => socket.emit('wheel:spin', { wheelId: id }, resolve))
      }),
    newWheel: () =>
      new Promise<WheelState>((resolve) => {
        socket.emit('wheel:new', (state: WheelState) => {
          wheelIdRef.current = state.wheelId
          onStateRef.current?.(state)
          resolve(state)
        })
      }),
  }
}
