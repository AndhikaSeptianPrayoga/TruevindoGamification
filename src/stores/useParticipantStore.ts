import { create } from 'zustand'
import type { AnswerOption, ParticipantAnswerResult, SessionState } from '@shared/types/game'

/** Locally recorded answer, used to rebuild the result if the server ack is ever lost. */
export interface PendingAnswer {
  questionId: string
  selectedOption: AnswerOption
  scoreBefore: number
}

interface ParticipantStore {
  participantId: string | null
  sessionState: SessionState | null
  selectedOption: AnswerOption | null
  latestResult: ParticipantAnswerResult | null
  lastAnswer: PendingAnswer | null
  setParticipantSession: (participantId: string, sessionState: SessionState) => void
  setSessionState: (sessionState: SessionState) => void
  setSelectedOption: (option: AnswerOption | null) => void
  setLatestResult: (result: ParticipantAnswerResult | null) => void
  setLastAnswer: (answer: PendingAnswer | null) => void
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  participantId: null,
  sessionState: null,
  selectedOption: null,
  latestResult: null,
  lastAnswer: null,
  setParticipantSession: (participantId, sessionState) =>
    set({
      participantId,
      sessionState,
      latestResult: null,
      selectedOption: null,
      lastAnswer: null,
    }),
  setSessionState: (sessionState) => set({ sessionState }),
  setSelectedOption: (selectedOption) => set({ selectedOption }),
  setLatestResult: (latestResult) => set({ latestResult }),
  setLastAnswer: (lastAnswer) => set({ lastAnswer }),
}))
