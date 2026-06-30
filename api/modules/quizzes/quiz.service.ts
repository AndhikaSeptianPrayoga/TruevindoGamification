import type { AnswerOption, QuizDetail, QuizStatus, QuizSummary } from '../../../shared/types/game.js'
import { getPrismaClient } from '../../prisma/client.js'

const SYSTEM_ADMIN_ID = 'system-admin-truevindo'
const SYSTEM_ADMIN_EMAIL = 'system@truevindo.games'

class QuizService {
  private requirePrisma() {
    const prisma = getPrismaClient()

    if (!prisma) {
      throw new Error('Prisma client belum siap. Jalankan `npm run prisma:generate` lalu restart server.')
    }

    return prisma
  }

  private normalizeStatus(status: string): QuizStatus {
    if (status === 'draft' || status === 'published' || status === 'archived') {
      return status
    }

    return 'draft'
  }

  private normalizeOption(value: string): AnswerOption {
    if (value === 'A' || value === 'B' || value === 'C' || value === 'D') {
      return value
    }

    return 'A'
  }

  private async ensureSystemAdmin() {
    const prisma = this.requirePrisma()

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

    return SYSTEM_ADMIN_ID
  }

  private toQuizSummary(payload: {
    id: string
    title: string
    description: string
    status: string
    updatedAt: Date
    _count?: { questions?: number }
  }): QuizSummary {
    return {
      id: payload.id,
      title: payload.title,
      description: payload.description,
      status: this.normalizeStatus(payload.status),
      questionCount: payload._count?.questions ?? 0,
      participantCount: 0,
      updatedAt: payload.updatedAt.toISOString(),
    }
  }

  private toQuizDetail(quiz: {
    id: string
    title: string
    description: string
    status: string
    updatedAt: Date
    questions: Array<{
      id: string
      quizId: string
      orderNo: number
      questionText: string
      imageUrl: string | null
      optionA: string
      optionB: string
      optionC: string
      optionD: string
      correctOption: string
      durationSeconds: number
    }>
  }): QuizDetail {
    const summary = this.toQuizSummary({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      updatedAt: quiz.updatedAt,
      _count: { questions: quiz.questions.length },
    })

    return {
      ...summary,
      questions: quiz.questions
        .slice()
        .sort((left, right) => left.orderNo - right.orderNo)
        .map((question) => ({
          id: question.id,
          quizId: question.quizId,
          orderNo: question.orderNo,
          text: question.questionText,
          imageUrl: question.imageUrl ?? '',
          options: {
            A: question.optionA,
            B: question.optionB,
            C: question.optionC,
            D: question.optionD,
          },
          correctOption: this.normalizeOption(question.correctOption),
          durationSeconds: question.durationSeconds,
        })),
    }
  }

  async getAll(): Promise<QuizSummary[]> {
    const prisma = this.requirePrisma()
    const quizzes = await prisma.quiz.findMany({
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return quizzes.map((quiz) =>
      this.toQuizSummary({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        status: quiz.status,
        updatedAt: quiz.updatedAt,
        _count: quiz._count,
      }),
    )
  }

  async getById(quizId: string): Promise<QuizDetail | undefined> {
    const prisma = this.requirePrisma()
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: {
            orderNo: 'asc',
          },
        },
      },
    })

    if (!quiz) {
      return undefined
    }

    return this.toQuizDetail({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      updatedAt: quiz.updatedAt,
      questions: quiz.questions,
    })
  }

  async createDraft(): Promise<QuizDetail> {
    const prisma = this.requirePrisma()
    const adminId = await this.ensureSystemAdmin()

    const created = await prisma.quiz.create({
      data: {
        title: 'Quiz Baru Truevindo',
        description: 'Tambahkan deskripsi kuis corporate Anda di sini.',
        status: 'draft',
        createdBy: adminId,
        questions: {
          create: [
            {
              orderNo: 1,
              questionText: '',
              imageUrl: '',
              optionA: '',
              optionB: '',
              optionC: '',
              optionD: '',
              correctOption: 'A',
              durationSeconds: 20,
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    })

    return this.toQuizDetail({
      id: created.id,
      title: created.title,
      description: created.description,
      status: created.status,
      updatedAt: created.updatedAt,
      questions: created.questions,
    })
  }

  async save(quizId: string, payload: QuizDetail): Promise<QuizDetail | undefined> {
    const prisma = this.requirePrisma()
    const adminId = await this.ensureSystemAdmin()

    const sourceQuestions = payload.questions.length
      ? payload.questions.slice().sort((left, right) => left.orderNo - right.orderNo)
      : [
          {
            id: `q-${Math.random().toString(36).slice(2, 10)}`,
            quizId,
            orderNo: 1,
            text: '',
            imageUrl: '',
            options: { A: '', B: '', C: '', D: '' },
            correctOption: 'A' as const,
            durationSeconds: 20,
          },
        ]

    const normalizedQuestions = sourceQuestions.map((question, index) => ({
      id: question.id,
      quizId,
      orderNo: index + 1,
      questionText: question.text ?? '',
      imageUrl: question.imageUrl ?? '',
      optionA: question.options.A ?? '',
      optionB: question.options.B ?? '',
      optionC: question.options.C ?? '',
      optionD: question.options.D ?? '',
      correctOption: question.correctOption,
      durationSeconds: question.durationSeconds ?? 20,
    }))

    const existing = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } })
    if (!existing) {
      return undefined
    }

    await prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: payload.title,
          description: payload.description,
          status: payload.status,
          createdBy: adminId,
        },
      })

      await tx.question.deleteMany({ where: { quizId } })

      await tx.question.createMany({
        data: normalizedQuestions.map((question) => ({
          id: question.id,
          quizId: question.quizId,
          orderNo: question.orderNo,
          questionText: question.questionText,
          imageUrl: question.imageUrl,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
          durationSeconds: question.durationSeconds,
        })),
      })
    })

    return this.getById(quizId)
  }

  async updateStatus(quizId: string, status: QuizDetail['status']): Promise<QuizDetail | undefined> {
    const prisma = this.requirePrisma()
    const existing = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } })

    if (!existing) {
      return undefined
    }

    await prisma.quiz.update({
      where: { id: quizId },
      data: { status },
    })

    return this.getById(quizId)
  }

  async duplicate(quizId: string): Promise<QuizDetail | undefined> {
    const prisma = this.requirePrisma()
    const adminId = await this.ensureSystemAdmin()

    const source = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: {
            orderNo: 'asc',
          },
        },
      },
    })

    if (!source) {
      return undefined
    }

    const created = await prisma.quiz.create({
      data: {
        title: `${source.title} Copy`,
        description: source.description,
        status: 'draft',
        createdBy: adminId,
        questions: {
          create: source.questions.map((question) => ({
            orderNo: question.orderNo,
            questionText: question.questionText,
            imageUrl: question.imageUrl ?? '',
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctOption: question.correctOption,
            durationSeconds: question.durationSeconds,
          })),
        },
      },
      include: {
        questions: true,
      },
    })

    return this.toQuizDetail({
      id: created.id,
      title: created.title,
      description: created.description,
      status: created.status,
      updatedAt: created.updatedAt,
      questions: created.questions,
    })
  }

  async delete(quizId: string): Promise<boolean> {
    const prisma = this.requirePrisma()
    const existing = await prisma.quiz.findUnique({ where: { id: quizId }, select: { id: true } })

    if (!existing) {
      return false
    }

    // A quiz cannot be deleted while game_sessions reference it (the
    // game_sessions -> quiz FK has no cascade). Remove the sessions first;
    // their participants, submissions, and snapshots cascade automatically,
    // and the quiz's questions cascade when the quiz itself is deleted.
    await prisma.$transaction(async (tx) => {
      await tx.gameSession.deleteMany({ where: { quizId } })
      await tx.quiz.delete({ where: { id: quizId } })
    })

    return true
  }
}

export const quizService = new QuizService()
