import { create } from 'zustand'
import type { AnswerOption, QuizDetail, QuizQuestion, QuizStatus } from '@shared/types/game'

interface QuizEditorStore {
  draft: QuizDetail | null
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: string | null
  setDraft: (quiz: QuizDetail | null) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setStatus: (status: QuizStatus) => void
  addQuestion: () => void
  removeQuestion: (questionId: string) => void
  updateQuestionText: (questionId: string, text: string) => void
  updateQuestionImageUrl: (questionId: string, imageUrl: string) => void
  updateQuestionDuration: (questionId: string, durationSeconds: number) => void
  updateQuestionOption: (questionId: string, option: AnswerOption, text: string) => void
  updateQuestionCorrectOption: (questionId: string, option: AnswerOption) => void
  markSaving: () => void
  markSaved: (quiz: QuizDetail) => void
}

function normalizeQuestions(questions: QuizQuestion[], quizId: string) {
  return questions.map((question, index) => ({
    ...question,
    quizId,
    orderNo: index + 1,
  }))
}

function createEmptyQuestion(quizId: string, orderNo: number): QuizQuestion {
  return {
    id: `question-${Math.random().toString(36).slice(2, 10)}`,
    quizId,
    orderNo,
    text: '',
    imageUrl: '',
    options: {
      A: '',
      B: '',
      C: '',
      D: '',
    },
    correctOption: 'A',
    durationSeconds: 20,
  }
}

export const useQuizEditorStore = create<QuizEditorStore>((set) => ({
  draft: null,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  setDraft: (draft) =>
    set({
      draft,
      isDirty: false,
      isSaving: false,
      lastSavedAt: draft ? new Date().toISOString() : null,
    }),
  setTitle: (title) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, title }, isDirty: true } : state,
    ),
  setDescription: (description) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, description }, isDirty: true } : state,
    ),
  setStatus: (status) =>
    set((state) =>
      state.draft ? { draft: { ...state.draft, status }, isDirty: true } : state,
    ),
  addQuestion: () =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      const nextQuestions = [
        ...state.draft.questions,
        createEmptyQuestion(state.draft.id, state.draft.questions.length + 1),
      ]

      return {
        draft: {
          ...state.draft,
          questionCount: nextQuestions.length,
          questions: normalizeQuestions(nextQuestions, state.draft.id),
        },
        isDirty: true,
      }
    }),
  removeQuestion: (questionId) =>
    set((state) => {
      if (!state.draft || state.draft.questions.length <= 1) {
        return state
      }

      const nextQuestions = state.draft.questions.filter((question) => question.id !== questionId)

      return {
        draft: {
          ...state.draft,
          questionCount: nextQuestions.length,
          questions: normalizeQuestions(nextQuestions, state.draft.id),
        },
        isDirty: true,
      }
    }),
  updateQuestionText: (questionId, text) =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      return {
        draft: {
          ...state.draft,
          questions: state.draft.questions.map((question) =>
            question.id === questionId ? { ...question, text } : question,
          ),
        },
        isDirty: true,
      }
    }),
  updateQuestionImageUrl: (questionId, imageUrl) =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      return {
        draft: {
          ...state.draft,
          questions: state.draft.questions.map((question) =>
            question.id === questionId ? { ...question, imageUrl } : question,
          ),
        },
        isDirty: true,
      }
    }),
  updateQuestionDuration: (questionId, durationSeconds) =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      return {
        draft: {
          ...state.draft,
          questions: state.draft.questions.map((question) =>
            question.id === questionId
              ? { ...question, durationSeconds: Math.max(5, durationSeconds || 5) }
              : question,
          ),
        },
        isDirty: true,
      }
    }),
  updateQuestionOption: (questionId, option, text) =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      return {
        draft: {
          ...state.draft,
          questions: state.draft.questions.map((question) =>
            question.id === questionId
              ? { ...question, options: { ...question.options, [option]: text } }
              : question,
          ),
        },
        isDirty: true,
      }
    }),
  updateQuestionCorrectOption: (questionId, option) =>
    set((state) => {
      if (!state.draft) {
        return state
      }

      return {
        draft: {
          ...state.draft,
          questions: state.draft.questions.map((question) =>
            question.id === questionId ? { ...question, correctOption: option } : question,
          ),
        },
        isDirty: true,
      }
    }),
  markSaving: () => set({ isSaving: true }),
  markSaved: (quiz) =>
    set({
      draft: quiz,
      isSaving: false,
      isDirty: false,
      lastSavedAt: new Date().toISOString(),
    }),
}))
