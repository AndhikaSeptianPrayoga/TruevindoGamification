import type {
  AnswerDistribution,
  ParticipantStanding,
  QuizDetail,
  SessionQuestionState,
  SessionState,
  SessionStatus,
} from '../../../shared/types/game.js'

export function buildQuestionForQuiz(
  quiz: QuizDetail,
  questionIndex: number,
  deadlineOffsetMs: number,
): SessionQuestionState | null {
  if (!quiz.questions.length) {
    return null
  }

  const safeIndex = Math.min(Math.max(questionIndex, 0), quiz.questions.length - 1)
  const active = quiz.questions[safeIndex]

  return {
    questionId: active.id,
    text: active.text,
    imageUrl: active.imageUrl,
    options: active.options,
    durationSeconds: active.durationSeconds,
    deadlineAt: new Date(Date.now() + deadlineOffsetMs).toISOString(),
    questionNumber: safeIndex + 1,
    totalQuestions: quiz.questions.length,
  }
}

interface BuildSessionStateFromQuizOptions {
  quiz: QuizDetail
  sessionId: string
  pinCode: string
  status: SessionStatus
  currentQuestionIndex: number
  participants: ParticipantStanding[]
  answerDistribution?: AnswerDistribution[]
  responsesReceived?: number
  activeQuestion?: SessionQuestionState | null
}

export function buildSessionStateFromQuiz({
  quiz,
  sessionId,
  pinCode,
  status,
  currentQuestionIndex,
  participants,
  answerDistribution = [],
  responsesReceived = 0,
  activeQuestion,
}: BuildSessionStateFromQuizOptions): SessionState {
  const questionIndex = Math.min(
    Math.max(currentQuestionIndex, 0),
    Math.max(quiz.questions.length - 1, 0),
  )
  const resolvedActiveQuestion =
    typeof activeQuestion !== 'undefined'
      ? activeQuestion
      : status === 'question_live'
        ? buildQuestionForQuiz(
            quiz,
            questionIndex,
            Math.max(quiz.questions[questionIndex]?.durationSeconds ?? 20, 1) * 1000,
          )
        : null

  return {
    sessionId,
    quizId: quiz.id,
    pinCode,
    status,
    quizTitle: quiz.title,
    joinedParticipants: participants.length,
    currentQuestionIndex: questionIndex,
    totalQuestions: quiz.questions.length,
    responsesReceived,
    leaderboard: participants,
    participants,
    activeQuestion: resolvedActiveQuestion,
    answerDistribution,
  }
}
