import type { Server } from 'socket.io'
import type { SubmitAnswerPayload, SubmitAnswerResponse } from '../../shared/types/game.js'
import { sessionService } from '../modules/sessions/session.service.js'

export function registerSessionGateway(io: Server) {
  const roundTimers = new Map<string, NodeJS.Timeout>()

  function clearRoundTimer(sessionId: string) {
    const timer = roundTimers.get(sessionId)

    if (timer) {
      clearTimeout(timer)
      roundTimers.delete(sessionId)
    }
  }

  function emitSessionState(nextState: ReturnType<typeof sessionService.getStateById>) {
    io.to(nextState.sessionId).emit('session:state', nextState)

    if (nextState.status === 'question_live') {
      io.to(nextState.sessionId).emit('question:start', nextState)
      clearRoundTimer(nextState.sessionId)

      const deadlineAt = nextState.activeQuestion?.deadlineAt
      const timeoutMs = deadlineAt ? Math.max(new Date(deadlineAt).getTime() - Date.now(), 0) : 0
      const timer = setTimeout(() => {
        try {
          const current = sessionService.getStateById(nextState.sessionId)

          if (current.status !== 'question_live') {
            clearRoundTimer(nextState.sessionId)
            return
          }

          const ended = sessionService.advanceStatus(nextState.sessionId, 'question_result')
          emitSessionState(ended)
        } catch {
          clearRoundTimer(nextState.sessionId)
        }
      }, timeoutMs)

      roundTimers.set(nextState.sessionId, timer)
      return
    }

    clearRoundTimer(nextState.sessionId)

    if (nextState.status === 'question_result') {
      io.to(nextState.sessionId).emit('question:result', nextState)
    }
  }

  io.on('connection', (socket) => {
    socket.on('session:join', ({ sessionId, role = 'participant' }) => {
      try {
        const sessionState = sessionService.getStateById(sessionId)
        socket.join(sessionId)

        if (role === 'host') {
          socket.emit('session:state', sessionState)
        }

        emitSessionState(sessionState)
      } catch (error) {
        socket.emit('session:error', {
          message: error instanceof Error ? error.message : 'Sesi tidak ditemukan',
        })
      }
    })

    socket.on(
      'answer:submit',
      (payload: SubmitAnswerPayload, callback?: (result: SubmitAnswerResponse) => void) => {
        try {
          const result = sessionService.submitAnswer(payload)

          io.to(payload.sessionId).emit('session:state', result.sessionState)
          io.to(payload.sessionId).emit('leaderboard:update', result.sessionState)

          if (
            result.sessionState.status === 'question_live' &&
            result.sessionState.joinedParticipants > 0 &&
            result.sessionState.responsesReceived >= result.sessionState.joinedParticipants
          ) {
            const ended = sessionService.advanceStatus(payload.sessionId, 'question_result')
            emitSessionState(ended)
          }

          if (callback) {
            callback(result)
          }
        } catch {
          if (callback) {
            callback({
              accepted: false,
              sessionState: sessionService.getStateById(payload.sessionId),
            })
          }
        }
      },
    )

    socket.on('host:status', ({ sessionId, status }) => {
      try {
        const nextState = sessionService.advanceStatus(sessionId, status)
        emitSessionState(nextState)
      } catch (error) {
        socket.emit('session:error', {
          message: error instanceof Error ? error.message : 'Gagal mengubah status sesi',
        })
      }
    })

    socket.on('host:advance', ({ sessionId }, callback?: (state: ReturnType<typeof sessionService.advanceSession>) => void) => {
      try {
        const nextState = sessionService.advanceSession(sessionId)
        emitSessionState(nextState)

        if (callback) {
          callback(nextState)
        }
      } catch (error) {
        socket.emit('session:error', {
          message: error instanceof Error ? error.message : 'Gagal memajukan sesi',
        })
      }
    })
  })
}
