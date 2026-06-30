import { create } from 'zustand'
import type { AnswerOption, ParticipantAnswerResult, SessionState } from '@shared/types/game'

interface ParticipantStore {
  participantId: string | null
  sessionState: SessionState | null
  selectedOption: AnswerOption | null
  latestResult: ParticipantAnswerResult | null
  setParticipantSession: (participantId: string, sessionState: SessionState) => void
  setSessionState: (sessionState: SessionState) => void
  setSelectedOption: (option: AnswerOption | null) => void
  setLatestResult: (result: ParticipantAnswerResult | null) => void
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  participantId: null,
  sessionState: null,
  selectedOption: null,
  latestResult: null,
  setParticipantSession: (participantId, sessionState) =>
    set({
      participantId,
      sessionState,
      latestResult: null,
      selectedOption: null,
    }),
  setSessionState: (sessionState) => set({ sessionState }),
  setSelectedOption: (selectedOption) => set({ selectedOption }),
  setLatestResult: (latestResult) => set({ latestResult }),
}))
