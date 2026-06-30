import { create } from 'zustand'
import type { QuizDetail, QuizSummary, SessionState } from '@shared/types/game'

interface HostStore {
  quizzes: QuizSummary[]
  activeQuiz: QuizDetail | null
  activeSession: SessionState | null
  setQuizzes: (quizzes: QuizSummary[]) => void
  setActiveQuiz: (quiz: QuizDetail | null) => void
  setActiveSession: (session: SessionState | null) => void
}

export const useHostStore = create<HostStore>((set) => ({
  quizzes: [],
  activeQuiz: null,
  activeSession: null,
  setQuizzes: (quizzes) => set({ quizzes }),
  setActiveQuiz: (activeQuiz) => set({ activeQuiz }),
  setActiveSession: (activeSession) => set({ activeSession }),
}))
