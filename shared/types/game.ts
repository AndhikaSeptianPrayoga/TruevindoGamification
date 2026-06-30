export type QuizStatus = 'draft' | 'published' | 'archived'

export type SessionStatus =
  | 'waiting'
  | 'countdown'
  | 'question_live'
  | 'question_result'
  | 'leaderboard'
  | 'completed'

export type AnswerOption = 'A' | 'B' | 'C' | 'D'

export interface QuizQuestion {
  id: string
  quizId: string
  orderNo: number
  text: string
  imageUrl?: string
  options: Record<AnswerOption, string>
  correctOption: AnswerOption
  durationSeconds: number
}

export interface QuizSummary {
  id: string
  title: string
  description: string
  status: QuizStatus
  questionCount: number
  participantCount: number
  updatedAt: string
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestion[]
}

export interface ParticipantStanding {
  id: string
  displayName: string
  score: number
  rank: number
  streak: number
  connected: boolean
}

export interface SessionQuestionState {
  questionId: string
  text: string
  imageUrl?: string
  options: Record<AnswerOption, string>
  durationSeconds: number
  deadlineAt: string
  questionNumber: number
  totalQuestions: number
}

export interface AnswerDistribution {
  option: AnswerOption
  count: number
  /** True for the option that is the correct answer (revealed in results). */
  isCorrect?: boolean
}

export interface ParticipantAnswerResult {
  questionId: string
  selectedOption: AnswerOption
  correctOption: AnswerOption
  isCorrect: boolean
  scoreAwarded: number
  rankAfterAnswer: number
}

export interface SessionState {
  sessionId: string
  quizId: string
  pinCode: string
  status: SessionStatus
  quizTitle: string
  joinedParticipants: number
  currentQuestionIndex: number
  totalQuestions: number
  responsesReceived: number
  leaderboard: ParticipantStanding[]
  participants: ParticipantStanding[]
  activeQuestion: SessionQuestionState | null
  answerDistribution: AnswerDistribution[]
  lastResult?: {
    questionId: string
    selectedOption: AnswerOption
    isCorrect: boolean
    scoreAwarded: number
  }
}

export interface JoinSessionRequest {
  pinCode: string
  displayName: string
}

export interface JoinSessionResponse {
  participantId: string
  sessionId: string
  sessionState: SessionState
}

export interface CreateSessionRequest {
  quizId: string
}

export interface CreateSessionResponse {
  sessionId: string
  pinCode: string
  qrCodeUrl: string
  state: SessionState
}

export interface SubmitAnswerPayload {
  sessionId: string
  participantId: string
  questionId: string
  selectedOption: AnswerOption
  responseTimeMs: number
}

export interface SocketSessionJoinedPayload {
  participantId: string
  sessionState: SessionState
}

export interface SubmitAnswerResponse {
  accepted: boolean
  sessionState: SessionState
  participantResult?: ParticipantAnswerResult
}
