import type {
  AnswerDistribution,
  AnswerOption,
  CreateSessionRequest,
  CreateSessionResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  ParticipantStanding,
  ParticipantAnswerResult,
  QuizDetail,
  SessionState,
  SessionStatus,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
} from '../../../shared/types/game.js'
import { buildSessionState, getQuizDetail } from '../../data/mock-data.js'
import { quizService } from '../quizzes/quiz.service.js'
import { sessionPersistenceService } from './session.persistence.js'
import { buildSessionStateFromQuiz } from './session-state.builder.js'

const defaultOrigin = process.env.APP_URL ?? 'http://localhost:5173'

class SessionService {
  private state: SessionState
  private sessions = new Map<string, SessionState>()
  private pinIndex = new Map<string, string>()
  private answerLedger = new Map<string, Map<string, SubmitAnswerPayload>>()
  private quizCache = new Map<string, QuizDetail>()

  constructor() {
    this.state = this.createDefaultSession()
  }

  private createDefaultSession() {
    return buildSessionState({
      quizId: 'quiz-corporate-values',
      sessionId: 'session-truevindo-001',
      pinCode: '482913',
      status: 'waiting',
      currentQuestionIndex: 0,
    })
  }

  private getCachedQuiz(quizId: string) {
    const quiz = this.quizCache.get(quizId)

    if (!quiz) {
      throw new Error('Quiz tidak tersedia untuk sesi ini')
    }

    return quiz
  }

  private async loadQuiz(quizId: string, forceRefresh = false) {
    if (!forceRefresh && this.quizCache.has(quizId)) {
      return this.quizCache.get(quizId)!
    }

    const quiz = await quizService.getById(quizId)
    if (!quiz) {
      throw new Error('Quiz tidak ditemukan')
    }

    this.quizCache.set(quiz.id, quiz)
    return quiz
  }

  private resetRegistry() {
    this.sessions.clear()
    this.pinIndex.clear()
    this.answerLedger.clear()
  }

  private generateSessionId() {
    return `session-${Math.random().toString(36).slice(2, 10)}`
  }

  private generatePinCode() {
    return String(Math.floor(100000 + Math.random() * 900000))
  }

  private registerSession(session: SessionState) {
    this.sessions.set(session.sessionId, session)
    this.pinIndex.set(session.pinCode, session.sessionId)
    this.state = session
    return session
  }

  private hydrateAnswerLedger(answers: SubmitAnswerPayload[]) {
    for (const answer of answers) {
      const key = this.getAnswerLedgerKey(answer.sessionId, answer.questionId)
      const existing = this.answerLedger.get(key) ?? new Map<string, SubmitAnswerPayload>()
      existing.set(answer.participantId, answer)
      this.answerLedger.set(key, existing)
    }
  }

  private getAnswerLedgerKey(sessionId: string, questionId: string) {
    return `${sessionId}:${questionId}`
  }

  private getAnswersForQuestion(sessionId: string, questionId: string) {
    const key = this.getAnswerLedgerKey(sessionId, questionId)
    const existing = this.answerLedger.get(key)

    if (existing) {
      return existing
    }

    const created = new Map<string, SubmitAnswerPayload>()
    this.answerLedger.set(key, created)
    return created
  }

  private buildDistributionFromAnswers(
    answers: Map<string, SubmitAnswerPayload>,
    correctOption?: AnswerOption,
  ): AnswerDistribution[] {
    const distribution: AnswerDistribution[] = [
      { option: 'A', count: 0 },
      { option: 'B', count: 0 },
      { option: 'C', count: 0 },
      { option: 'D', count: 0 },
    ]

    answers.forEach((payload) => {
      const target = distribution.find((item) => item.option === payload.selectedOption)
      if (target) {
        target.count += 1
      }
    })

    // Only reveal the correct option once the round is being summarized, so the
    // answer key never leaks to participants while a question is still live.
    if (correctOption) {
      for (const item of distribution) {
        item.isCorrect = item.option === correctOption
      }
    }

    return distribution
  }

  private buildProgressedSession(
    base: SessionState,
    overrides: Partial<SessionState> = {},
    nextStatus = base.status,
  ) {
    const quiz = this.getCachedQuiz(base.quizId)
    const participants = overrides.participants ?? base.participants

    return buildSessionStateFromQuiz({
      quiz,
      sessionId: base.sessionId,
      pinCode: base.pinCode,
      status: nextStatus,
      currentQuestionIndex: overrides.currentQuestionIndex ?? base.currentQuestionIndex,
      participants,
      responsesReceived: overrides.responsesReceived ?? base.responsesReceived,
      answerDistribution: overrides.answerDistribution ?? base.answerDistribution,
      activeQuestion: typeof overrides.activeQuestion !== 'undefined' ? overrides.activeQuestion : undefined,
    })
  }

  private getSessionOrThrow(sessionId: string) {
    const session = this.sessions.get(sessionId)

    if (!session) {
      throw new Error('Sesi tidak ditemukan')
    }

    return session
  }

  private rebuildSession(base: SessionState, status: SessionStatus) {
    return this.buildProgressedSession(base, {}, status)
  }

  private createJoinState(participantId: string, displayName: string, baseState: SessionState) {
    const mergedParticipants = [
      { id: participantId, displayName, score: 0, rank: baseState.participants.length + 1, streak: 0, connected: true },
      ...baseState.participants.filter((participant) => participant.id !== participantId),
    ]

    return {
      ...baseState,
      participants: mergedParticipants,
      joinedParticipants: mergedParticipants.length,
      leaderboard: mergedParticipants,
    }
  }

  private rankParticipants(participants: ParticipantStanding[]) {
    return [...participants]
      .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
      .map((participant, index) => ({
        ...participant,
        rank: index + 1,
      }))
  }

  private calculateScore(session: SessionState, payload: SubmitAnswerPayload, isCorrect: boolean) {
    if (!isCorrect) {
      return 0
    }

    // Speed-based scoring: a fast correct answer earns up to BASE + SPEED_BONUS,
    // a slow one (answered near the deadline) earns only the BASE points.
    const BASE_POINTS = 500
    const SPEED_BONUS = 500
    const durationMs = Math.max(session.activeQuestion?.durationSeconds ?? 20, 1) * 1000
    const speedRatio = Math.max(0, Math.min(1, 1 - payload.responseTimeMs / durationMs))
    return BASE_POINTS + Math.round(speedRatio * SPEED_BONUS)
  }

  getState(): SessionState {
    return this.state
  }

  async initialize() {
    this.resetRegistry()
    const restoredSessions = await sessionPersistenceService.loadRestorableSessions()

    if (restoredSessions.length > 0) {
      for (const restored of restoredSessions) {
        await this.loadQuiz(restored.state.quizId).catch(() => undefined)
        this.registerSession(restored.state)
        this.hydrateAnswerLedger(restored.answers)
      }

      return restoredSessions.length
    }

    const fallbackQuiz = getQuizDetail('quiz-corporate-values')
    if (fallbackQuiz) {
      this.quizCache.set(fallbackQuiz.id, fallbackQuiz)
    }

    const defaultSession = this.registerSession(this.createDefaultSession())
    sessionPersistenceService.recordSessionCreated(defaultSession)
    return 1
  }

  getStateById(sessionId: string): SessionState {
    return this.getSessionOrThrow(sessionId)
  }

  joinSession(payload: JoinSessionRequest): JoinSessionResponse {
    const sessionId = this.pinIndex.get(payload.pinCode)

    if (!sessionId) {
      throw new Error('QUIZ ID tidak valid atau sesi belum aktif')
    }

    const base = this.getSessionOrThrow(sessionId)
    const participantId = `participant-${payload.displayName.toLowerCase().replace(/\s+/g, '-')}`
    const nextState = this.createJoinState(participantId, payload.displayName, base)
    this.registerSession(nextState)
    sessionPersistenceService.recordParticipantJoin(nextState)

    return {
      participantId,
      sessionId: nextState.sessionId,
      sessionState: nextState,
    }
  }

  async createSession(payload: CreateSessionRequest): Promise<CreateSessionResponse> {
    // Always reload the quiz fresh so newly edited content (e.g. added images)
    // is reflected, instead of serving a stale cached copy from an earlier host.
    const quiz = await this.loadQuiz(payload.quizId, true)
    const nextState = this.registerSession(
      buildSessionStateFromQuiz({
        quiz,
        sessionId: this.generateSessionId(),
        pinCode: this.generatePinCode(),
        status: 'waiting',
        currentQuestionIndex: 0,
        participants: [],
      }),
    )
    sessionPersistenceService.recordSessionCreated(nextState)

    return {
      sessionId: nextState.sessionId,
      pinCode: nextState.pinCode,
      qrCodeUrl: `${defaultOrigin}/join/${nextState.pinCode}`,
      state: nextState,
    }
  }

  advanceStatus(sessionId: string, status: SessionStatus): SessionState {
    const base = this.getSessionOrThrow(sessionId)
    const currentQuestionId = base.activeQuestion?.questionId
    const answers = currentQuestionId
      ? this.getAnswersForQuestion(base.sessionId, currentQuestionId)
      : new Map<string, SubmitAnswerPayload>()
    const nextState = this.registerSession(
      this.buildProgressedSession(
        base,
        {
          responsesReceived: answers.size,
          answerDistribution:
            status === 'question_result' || status === 'leaderboard' || status === 'completed'
              ? this.buildDistributionFromAnswers(answers, this.getAnswerKey(base))
              : [],
        },
        status,
      ),
    )
    sessionPersistenceService.recordStatusTransition(nextState)
    return nextState
  }

  advanceSession(sessionId: string): SessionState {
    const base = this.getSessionOrThrow(sessionId)

    if (base.status === 'waiting') {
      // Start with a synchronized 3-2-1 standby before the first question goes
      // live; the gateway drives the timing and then transitions to question_live.
      return this.advanceStatus(sessionId, 'countdown')
    }

    if (base.status === 'countdown') {
      return this.advanceStatus(sessionId, 'question_live')
    }

    if (base.status === 'question_live') {
      return this.advanceStatus(sessionId, 'question_result')
    }

    if (base.status === 'question_result' || base.status === 'leaderboard') {
      const nextQuestionIndex = base.currentQuestionIndex + 1
      const hasNextQuestion = nextQuestionIndex < base.totalQuestions

      if (!hasNextQuestion) {
        return this.advanceStatus(sessionId, 'completed')
      }

      const nextState = this.registerSession(
        this.buildProgressedSession(
          base,
          {
            currentQuestionIndex: nextQuestionIndex,
            responsesReceived: 0,
            answerDistribution: [],
            lastResult: undefined,
          },
          'question_live',
        ),
      )
      sessionPersistenceService.recordStatusTransition(nextState)

      return nextState
    }

    return base
  }

  submitAnswer(payload: SubmitAnswerPayload): SubmitAnswerResponse {
    const base = this.getSessionOrThrow(payload.sessionId)
    const questionId = base.activeQuestion?.questionId

    if (!questionId || questionId !== payload.questionId) {
      throw new Error('Soal aktif tidak sesuai dengan jawaban yang dikirim')
    }

    const answers = this.getAnswersForQuestion(payload.sessionId, payload.questionId)
    const existing = answers.get(payload.participantId)

    if (existing) {
      const participant = base.leaderboard.find((item) => item.id === payload.participantId)
      return {
        accepted: false,
        sessionState: base,
        participantResult: {
          questionId: payload.questionId,
          selectedOption: existing.selectedOption,
          correctOption: this.getAnswerKey(base),
          isCorrect: existing.selectedOption === this.getAnswerKey(base),
          scoreAwarded: this.calculateScore(base, existing, existing.selectedOption === this.getAnswerKey(base)),
          rankAfterAnswer: participant?.rank ?? base.joinedParticipants,
        },
      }
    }

    const isCorrect = payload.selectedOption === this.getAnswerKey(base)
    const scoreAwarded = this.calculateScore(base, payload, isCorrect)
    answers.set(payload.participantId, payload)
    const updatedParticipants = this.rankParticipants(
      base.participants.map((participant) =>
        participant.id === payload.participantId
          ? {
              ...participant,
              score: participant.score + scoreAwarded,
              streak: isCorrect ? participant.streak + 1 : 0,
            }
          : participant,
      ),
    )

    const nextState = this.registerSession({
      ...this.buildProgressedSession(
        {
          ...base,
          participants: updatedParticipants,
          leaderboard: updatedParticipants,
          joinedParticipants: updatedParticipants.length,
        },
        {
          responsesReceived: answers.size,
          answerDistribution: this.buildDistributionFromAnswers(answers),
          lastResult: undefined,
        },
        base.status,
      ),
      participants: updatedParticipants,
      leaderboard: updatedParticipants,
      joinedParticipants: updatedParticipants.length,
      responsesReceived: answers.size,
      answerDistribution: this.buildDistributionFromAnswers(answers),
      lastResult: undefined,
    })

    const participant = updatedParticipants.find((item) => item.id === payload.participantId)
    const participantResult: ParticipantAnswerResult = {
      questionId: payload.questionId,
      selectedOption: payload.selectedOption,
      correctOption: this.getAnswerKey(base),
      isCorrect,
      scoreAwarded,
      rankAfterAnswer: participant?.rank ?? updatedParticipants.length,
    }

    sessionPersistenceService.recordAnswerSubmission(nextState, payload, participantResult)

    return {
      accepted: true,
      sessionState: nextState,
      participantResult,
    }
  }

  getHostTimeline(sessionId: string): SessionState[] {
    const base = this.getStateById(sessionId)

    return [
      this.rebuildSession(base, 'waiting'),
      this.rebuildSession(base, 'question_live'),
      this.rebuildSession(base, 'question_result'),
      this.rebuildSession(base, 'leaderboard'),
      this.rebuildSession(base, 'completed'),
    ]
  }

  getAnswerKey(session: SessionState): AnswerOption {
    const quiz = this.getCachedQuiz(session.quizId)
    const currentQuestion = quiz.questions[session.currentQuestionIndex]

    if (!currentQuestion) {
      return 'A'
    }

    return currentQuestion.correctOption
  }
}

export const sessionService = new SessionService()
