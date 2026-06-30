import { useEffect, useMemo, useRef } from 'react'
import { io } from 'socket.io-client'
import type { SessionState, SubmitAnswerPayload, SubmitAnswerResponse } from '@shared/types/game'

interface UseSessionSocketOptions {
  sessionId?: string | null
  role?: 'participant' | 'host'
  onState?: (state: SessionState) => void
  onQuestionResult?: (state: SessionState) => void
  onLeaderboard?: (state: SessionState) => void
}

export function useSessionSocket({
  sessionId,
  role = 'participant',
  onState,
  onQuestionResult,
  onLeaderboard,
}: UseSessionSocketOptions) {
  const onStateRef = useRef(onState)
  const onQuestionResultRef = useRef(onQuestionResult)
  const onLeaderboardRef = useRef(onLeaderboard)

  useEffect(() => {
    onStateRef.current = onState
  }, [onState])

  useEffect(() => {
    onQuestionResultRef.current = onQuestionResult
  }, [onQuestionResult])

  useEffect(() => {
    onLeaderboardRef.current = onLeaderboard
  }, [onLeaderboard])

  const socket = useMemo(
    () =>
      io('/', {
        autoConnect: false,
        transports: ['websocket'],
      }),
    [],
  )

  useEffect(() => {
    if (!sessionId) {
      return undefined
    }

    const handleState = (state: SessionState) => {
      onStateRef.current?.(state)
    }

    const handleQuestionResult = (state: SessionState) => {
      onQuestionResultRef.current?.(state)
    }

    const handleLeaderboard = (state: SessionState) => {
      onLeaderboardRef.current?.(state)
    }

    socket.connect()
    socket.emit('session:join', { sessionId, role })
    socket.on('session:state', handleState)
    socket.on('question:start', handleState)
    socket.on('question:result', handleQuestionResult)
    socket.on('leaderboard:update', handleLeaderboard)

    return () => {
      socket.off('session:state', handleState)
      socket.off('question:start', handleState)
      socket.off('question:result', handleQuestionResult)
      socket.off('leaderboard:update', handleLeaderboard)
      socket.disconnect()
    }
  }, [role, sessionId, socket])

  return {
    submitAnswer: (payload: SubmitAnswerPayload) =>
      new Promise<SubmitAnswerResponse>((resolve) => {
        socket.emit('answer:submit', payload, resolve)
      }),
    updateHostStatus: (status: SessionState['status']) =>
      new Promise<SessionState | null>((resolve) => {
        socket.emit('host:status', { sessionId, status })
        resolve(null)
      }),
    advanceHostStage: () =>
      new Promise<SessionState>((resolve) => {
        socket.emit('host:advance', { sessionId }, resolve)
      }),
  }
}
