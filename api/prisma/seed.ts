import { getPrismaClient } from './client.js'
import { getQuizDetail } from '../data/mock-data.js'

const SYSTEM_ADMIN_ID = 'system-admin-truevindo'
const SYSTEM_ADMIN_EMAIL = 'system@truevindo.games'

async function seedQuiz(quizId: string) {
  const prisma = getPrismaClient()

  if (!prisma) {
    throw new Error('Prisma client is not ready. Run `npm run prisma:generate` first.')
  }

  const quiz = getQuizDetail(quizId)

  if (!quiz) {
    return
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

  if (!quiz.questions.length) {
    return
  }

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

const QUIZ_IDS = [
  'quiz-corporate-values',
  'quiz-sales-kickoff',
  'quiz-product-knowledge',
  'quiz-cyber-security',
  'quiz-team-building',
]

async function main() {
  for (const quizId of QUIZ_IDS) {
    await seedQuiz(quizId)
    console.log(`Seeded quiz: ${quizId}`)
  }
  console.log(`Done. ${QUIZ_IDS.length} quizzes seeded.`)
}

main()
  .then(async () => {
    const prisma = getPrismaClient()
    await prisma?.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    const prisma = getPrismaClient()
    await prisma?.$disconnect()
    process.exit(1)
  })

