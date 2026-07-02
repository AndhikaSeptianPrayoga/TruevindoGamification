import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from '@/pages/AdminLoginPage'
import { ProtectedAdminRoute } from '@/components/admin/ProtectedAdminRoute'
import HostLobbyPage from '@/pages/HostLobbyPage'
import HostLivePage from '@/pages/HostLivePage'
import HostPodiumPage from '@/pages/HostPodiumPage'
import HostSummaryPage from '@/pages/HostSummaryPage'
import JoinPage from '@/pages/JoinPage'
import ParticipantFinishedPage from '@/pages/ParticipantFinishedPage'
import ParticipantLobbyPage from '@/pages/ParticipantLobbyPage'
import PlayPage from '@/pages/PlayPage'
import QuizEditorPage from '@/pages/QuizEditorPage'
import QuizListPage from '@/pages/QuizListPage'
import ResultPage from '@/pages/ResultPage'
import MiniGamesHostPage from '@/pages/MiniGamesHostPage'
import MiniGamesPlayPage from '@/pages/MiniGamesPlayPage'
import SpamHostPage from '@/pages/SpamHostPage'
import SpamPlayPage from '@/pages/SpamPlayPage'
import WheelHostPage from '@/pages/WheelHostPage'
import WheelJoinPage from '@/pages/WheelJoinPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join/:pin" element={<JoinPage />} />
        <Route path="/lobby/:sessionId" element={<ParticipantLobbyPage />} />
        <Route path="/play/:sessionId" element={<PlayPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
        <Route path="/finished/:sessionId" element={<ParticipantFinishedPage />} />
        <Route path="/wheel/:wheelId" element={<WheelJoinPage />} />
        <Route path="/spam/:gameId" element={<SpamPlayPage />} />
        <Route path="/minigames/:eventId" element={<MiniGamesPlayPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/wheel"
          element={
            <ProtectedAdminRoute>
              <WheelHostPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/spam"
          element={
            <ProtectedAdminRoute>
              <SpamHostPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/minigames"
          element={
            <ProtectedAdminRoute>
              <MiniGamesHostPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/quizzes"
          element={
            <ProtectedAdminRoute>
              <QuizListPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/quizzes/new"
          element={
            <ProtectedAdminRoute>
              <Navigate to="/admin/quizzes" replace />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/quizzes/:quizId/edit"
          element={
            <ProtectedAdminRoute>
              <QuizEditorPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sessions/:sessionId/lobby"
          element={
            <ProtectedAdminRoute>
              <HostLobbyPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sessions/:sessionId/live"
          element={
            <ProtectedAdminRoute>
              <HostLivePage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sessions/:sessionId/summary"
          element={
            <ProtectedAdminRoute>
              <HostSummaryPage />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/sessions/:sessionId/podium"
          element={
            <ProtectedAdminRoute>
              <HostPodiumPage />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
