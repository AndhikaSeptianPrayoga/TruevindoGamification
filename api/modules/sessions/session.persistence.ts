import { getPrismaClient } from '../../prisma/client.js'
import { getQuizDetail } from '../../data/mock-data.js'
import { quizService } from '../quizzes/quiz.service.js'
import type {
  AnswerDistribution,
  ParticipantAnswerResult,
  ParticipantStanding,
  SessionState,
  SessionStatus,
  SubmitAnswerPayload,
} from '../../../shared/types/game.js'
import { buildSessionStateFromQuiz } from './session-state.builder.js'

const SYSTEM_ADMIN_ID = 'system-admin-truevindo'
const SYSTEM_ADMIN_EMAIL = 'system@truevindo.games'
const restorableStatuses: SessionStatus[] = ['waiting', 'question_live', 'question_result', 'leaderboard']

export interface RestoredSessionBundle {
  state: SessionState
  answers: SubmitAnswerPayload[]
}

class SessionPersistenceService {
  private warnedOperations = new Set<string>()
  private startedAt = new Map<string, Date>()
  private endedAt = new Map<string, Date>()
  private seededQuizIds = new Set<string>()

  private warnOnce(operation: string, error: unknown) {
    if (this.warnedOperations.has(operation)) {
      return
    }

    this.warnedOperations.add(operation)
    const detail = error instanceof Error ? error.message : 'unknown persistence error'
    console.warn(`[session-persistence] ${operation} skipped: ${detail}`)
  }

  private runBestEffort(operation: string, task: () => Promise<void>) {
    void task().catch((error) => this.warnOnce(operation, error))
  }

  private requirePrisma() {
    const prisma = getPrismaClient()

    if (!prisma) {
      throw new Error('Prisma client belum siap. Jalankan `npm run prisma:generate` lalu restart server.')
    }

    return prisma
  }

  private normalizeStatus(status: string): SessionStatus {
    if (
      status === 'waiting'
      || status === 'countdown'
      || status === 'question_live'
      || status === 'question_result'
      || status === 'leaderboard'
      || status === 'completed'
    ) {
      return status
    }

    return 'waiting'
  }

  private rankParticipants(participants: ParticipantStanding[]) {
    return [...participants]
      .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
      .map((participant, index) => ({
        ...participant,
        rank: index + 1,
      }))
  }

  private buildDistributionFromAnswers(answers: SubmitAnswerPayload[]): AnswerDistribution[] {
    const distribution: AnswerDistribution[] = [
      { option: 'A', count: 0 },
      { option: 'B', count: 0 },
      { option: 'C', count: 0 },
      { option: 'D', count: 0 },
    ]

    for (const answer of answers) {
      const target = distribution.find((item) => item.option === answer.selectedOption)
      if (target) {
        target.count += 1
      }
    }

    return distribution
  }

  private calculateStreak(
    participantId: string,
    orderedQuestionIds: string[],
    submissions: Array<{ participantId: string; questionId: string; isCorrect: boolean }>,
  ) {
    const orderMap = new Map(orderedQuestionIds.map((questionId, index) => [questionId, index]))
    const participantSubmissions = submissions
      .filter((submission) => submission.participantId === participantId)
      .sort(
        (left, right) =>
          (orderMap.get(left.questionId) ?? Number.MAX_SAFE_INTEGER)
          - (orderMap.get(right.questionId) ?? Number.MAX_SAFE_INTEGER),
      )

    let streak = 0

    for (let index = participantSubmissions.length - 1; index >= 0; index -= 1) {
      if (!participantSubmissions[index].isCorrect) {
        break
      }

      streak += 1
    }

    return streak
  }

  private async getQuestionId(session: SessionState) {
    if (session.activeQuestion?.questionId) {
      return session.activeQuestion.questionId
    }

    const quiz = await quizService.getById(session.quizId)
    return quiz?.questions[session.currentQuestionIndex]?.id ?? null
  }

  private rememberSessionTimestamps(session: SessionState) {
    if (session.status !== 'waiting' && !this.startedAt.has(session.sessionId)) {
      this.startedAt.set(session.sessionId, new Date())
    }

    if (session.status === 'completed' && !this.endedAt.has(session.sessionId)) {
      this.endedAt.set(session.sessionId, new Date())
    }
  }

  private async ensureQuizAvailable(quizId: string) {
    const prisma = this.requirePrisma()
    const existing = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    })

    if (existing) {
      return
    }

    if (this.seededQuizIds.has(quizId)) {
      return
    }

    const quiz = getQuizDetail(quizId)

    if (!quiz) {
      throw new Error(`Quiz ${quizId} tidak ditemukan untuk persistence`)
    }

    await prisma.adminUser.upsert({
      where: { email: SYSTEM_ADMIN_EMAIL },
      update: {
        fullName: 'Truevindo System',
      },
      create: {
        id: SYSTEM_ADMIN_ID,
        email: SYSTEM_ADMIN_EMAIL,
        passwordHash: 'managed-outside-demo-flow',
        fullName: 'Truevindo System',
      },
    })

    await prisma.quiz.upsert({
      where: { id: quiz.id },
      update: {
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        createdBy: SYSTEM_ADMIN_ID,
      },
      create: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        createdBy: SYSTEM_ADMIN_ID,
      },
    })

    await prisma.question.deleteMany({
      where: { quizId: quiz.id },
    })

    if (quiz.questions.length) {
      await prisma.question.createMany({
        data: quiz.questions.map((question) => ({
          id: question.id,
          quizId: quiz.id,
          orderNo: question.orderNo,
          questionText: question.text,
          imageUrl: question.imageUrl ?? '',
          optionA: question.options.A,
          optionB: question.options.B,
          optionC: question.options.C,
          optionD: question.options.D,
          correctOption: question.correctOption,
          durationSeconds: question.durationSeconds,
        })),
      })
    }

    this.seededQuizIds.add(quizId)
  }

  private async persistSessionState(session: SessionState) {
    const prisma = this.requirePrisma()
    this.rememberSessionTimestamps(session)
    await this.ensureQuizAvailable(session.quizId)

    await prisma.gameSession.upsert({
      where: { id: session.sessionId },
      update: {
        quizId: session.quizId,
        pinCode: session.pinCode,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        startedAt: this.startedAt.get(session.sessionId) ?? null,
        endedAt: this.endedAt.get(session.sessionId) ?? null,
      },
      create: {
        id: session.sessionId,
        quizId: session.quizId,
        pinCode: session.pinCode,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        startedAt: this.startedAt.get(session.sessionId) ?? null,
        endedAt: this.endedAt.get(session.sessionId) ?? null,
      },
    })

    for (const participant of session.participants) {
      await prisma.participant.upsert({
        where: { id: participant.id },
        update: {
          sessionId: session.sessionId,
          displayName: participant.displayName,
          score: participant.score,
          currentRank: participant.rank,
          connected: participant.connected,
        },
        create: {
          id: participant.id,
          sessionId: session.sessionId,
          displayName: participant.displayName,
          score: participant.score,
          currentRank: participant.rank,
          connected: participant.connected,
        },
      })
    }
  }

  private async persistLeaderboardSnapshot(session: SessionState) {
    const prisma = this.requirePrisma()
    if (!session.leaderboard.length) {
      return
    }

    const questionId = await this.getQuestionId(session)
    await prisma.leaderboardSnapshot.createMany({
      data: session.leaderboard.map((participant) => ({
        sessionId: session.sessionId,
        questionId,
        rankNo: participant.rank,
        participantId: participant.id,
        score: participant.score,
      })),
    })
  }

  recordSessionCreated(session: SessionState) {
    this.runBestEffort('create-session', async () => {
      await this.persistSessionState(session)
    })
  }

  recordParticipantJoin(session: SessionState) {
    this.runBestEffort('join-session', async () => {
      await this.persistSessionState(session)
    })
  }

  recordAnswerSubmission(
    session: SessionState,
    payload: SubmitAnswerPayload,
    participantResult?: ParticipantAnswerResult,
  ) {
    this.runBestEffort('submit-answer', async () => {
      const prisma = this.requirePrisma()
      await this.persistSessionState(session)

      await prisma.answerSubmission.upsert({
        where: {
          participantId_questionId: {
            participantId: payload.participantId,
            questionId: payload.questionId,
          },
        },
        update: {
          sessionId: payload.sessionId,
          selectedOption: payload.selectedOption,
          isCorrect: participantResult?.isCorrect ?? false,
          responseTimeMs: payload.responseTimeMs,
          scoreAwarded: participantResult?.scoreAwarded ?? 0,
        },
        create: {
          sessionId: payload.sessionId,
          participantId: payload.participantId,
          questionId: payload.questionId,
          selectedOption: payload.selectedOption,
          isCorrect: participantResult?.isCorrect ?? false,
          responseTimeMs: payload.responseTimeMs,
          scoreAwarded: participantResult?.scoreAwarded ?? 0,
        },
      })
    })
  }

  recordStatusTransition(session: SessionState) {
    this.runBestEffort(`status-${session.status}`, async () => {
      await this.persistSessionState(session)

      if (session.status === 'question_result' || session.status === 'leaderboard' || session.status === 'completed') {
        await this.persistLeaderboardSnapshot(session)
      }
    })
  }

  async loadRestorableSessions(): Promise<RestoredSessionBundle[]> {
    try {
      const prisma = this.requirePrisma()
      const persistedSessions = await prisma.gameSession.findMany({
        where: {
          status: {
            in: restorableStatuses,
          },
        },
        include: {
          participants: true,
          submissions: {
            orderBy: {
              submittedAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      const bundles: RestoredSessionBundle[] = []

      for (const persistedSession of persistedSessions) {
        const quiz = await quizService.getById(persistedSession.quizId)

        if (!quiz) {
          this.warnOnce(
            'restore-sessions',
            new Error(`Quiz ${persistedSession.quizId} tidak tersedia untuk restore session ${persistedSession.id}`),
          )
          continue
        }

        if (persistedSession.startedAt) {
          this.startedAt.set(persistedSession.id, persistedSession.startedAt)
        }

        if (persistedSession.endedAt) {
          this.endedAt.set(persistedSession.id, persistedSession.endedAt)
        }

        const orderedQuestionIds = quiz.questions
          .slice()
          .sort((left, right) => left.orderNo - right.orderNo)
          .map((question) => question.id)
        const participants = this.rankParticipants(
          persistedSession.participants.map((participant) => ({
            id: participant.id,
            displayName: participant.displayName,
            score: participant.score,
            rank: participant.currentRank,
            streak: this.calculateStreak(participant.id, orderedQuestionIds, persistedSession.submissions),
            connected: participant.connected,
          })),
        )
        const safeQuestionIndex = Math.min(
          Math.max(persistedSession.currentQuestionIndex, 0),
          Math.max(quiz.questions.length - 1, 0),
        )
        const activeQuestionId = quiz.questions[safeQuestionIndex]?.id
        const currentQuestionAnswers = activeQuestionId
          ? persistedSession.submissions
              .filter((submission) => submission.questionId === activeQuestionId)
              .map((submission) => ({
                sessionId: persistedSession.id,
                participantId: submission.participantId,
                questionId: submission.questionId,
                selectedOption: submission.selectedOption as SubmitAnswerPayload['selectedOption'],
                responseTimeMs: submission.responseTimeMs,
              }))
          : []
        const status = this.normalizeStatus(persistedSession.status)
        const restoredState = buildSessionStateFromQuiz({
          quiz,
          sessionId: persistedSession.id,
          pinCode: persistedSession.pinCode,
          status,
          currentQuestionIndex: safeQuestionIndex,
          participants,
          responsesReceived: currentQuestionAnswers.length,
          answerDistribution:
            status === 'question_result' || status === 'leaderboard' || status === 'completed'
              ? this.buildDistributionFromAnswers(currentQuestionAnswers)
              : [],
        })
        const allAnswers: SubmitAnswerPayload[] = persistedSession.submissions.map((submission) => ({
          sessionId: persistedSession.id,
          participantId: submission.participantId,
          questionId: submission.questionId,
          selectedOption: submission.selectedOption as SubmitAnswerPayload['selectedOption'],
          responseTimeMs: submission.responseTimeMs,
        }))

        bundles.push({
          state: restoredState,
          answers: allAnswers,
        })
      }

      return bundles
    } catch (error) {
      this.warnOnce('restore-sessions', error)
      return []
    }
  }
}

export const sessionPersistenceService = new SessionPersistenceService()
