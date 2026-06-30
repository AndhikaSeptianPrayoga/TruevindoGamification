import type {
  CreateSessionRequest,
  CreateSessionResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  QuizDetail,
  QuizStatus,
  QuizSummary,
  SessionState,
} from '@shared/types/game'

interface ApiEnvelope<T> {
  success: boolean
  data: T
}

export interface AdminLoginResponse {
  accessToken: string
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init)

  if (!response.ok) {
    let message = `Request failed: ${response.status}`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Ignore non-JSON error bodies.
    }

    throw new Error(message)
  }

  const payload = (await response.json()) as ApiEnvelope<T>
  return payload.data
}

export function loginAdmin(email: string, password: string) {
  return requestJson<AdminLoginResponse>('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export function getQuizzes() {
  return requestJson<QuizSummary[]>('/api/admin/quizzes')
}

export function getQuizDetail(quizId: string) {
  return requestJson<QuizDetail>(`/api/admin/quizzes/${quizId}`)
}

export function createQuizDraft() {
  return requestJson<QuizDetail>('/api/admin/quizzes/draft', {
    method: 'POST',
  })
}

export function saveQuizDetail(quizId: string, payload: QuizDetail) {
  return requestJson<QuizDetail>(`/api/admin/quizzes/${quizId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function duplicateQuiz(quizId: string) {
  return requestJson<QuizDetail>(`/api/admin/quizzes/${quizId}/duplicate`, {
    method: 'POST',
  })
}

export function updateQuizStatus(quizId: string, status: QuizStatus) {
  return requestJson<QuizDetail>(`/api/admin/quizzes/${quizId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
}

export function deleteQuiz(quizId: string) {
  return requestJson<{ id: string }>(`/api/admin/quizzes/${quizId}`, {
    method: 'DELETE',
  })
}

export function createSession(payload: CreateSessionRequest) {
  return requestJson<CreateSessionResponse>('/api/admin/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getAdminSessionState(sessionId: string) {
  return requestJson<SessionState>(`/api/admin/sessions/${sessionId}/state`)
}

export function startAdminSession(sessionId: string) {
  return requestJson<SessionState>(`/api/admin/sessions/${sessionId}/start`, {
    method: 'POST',
  })
}

export function advanceAdminSession(sessionId: string) {
  return requestJson<SessionState>(`/api/admin/sessions/${sessionId}/next`, {
    method: 'POST',
  })
}

export function finishAdminSession(sessionId: string) {
  return requestJson<SessionState>(`/api/admin/sessions/${sessionId}/finish`, {
    method: 'POST',
  })
}

export function joinSession(payload: JoinSessionRequest) {
  return requestJson<JoinSessionResponse>('/api/player/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function getPlayerState(sessionId: string) {
  return requestJson<SessionState>(`/api/player/sessions/${sessionId}/state`)
}
