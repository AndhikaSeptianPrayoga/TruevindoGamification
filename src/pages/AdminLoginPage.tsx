import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/common/AppShell'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'
import { loginAdmin } from '@/utils/api'

export default function AdminLoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { accessToken, hasHydrated, setSession } = useAdminAuthStore()
  const [email, setEmail] = useState('admin@truevindo.games')
  const [password, setPassword] = useState('demo-password')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hasHydrated && accessToken) {
      const targetPath =
        typeof location.state?.from === 'string' ? location.state.from : '/admin/quizzes'
      navigate(targetPath, { replace: true })
    }
  }, [accessToken, hasHydrated, location.state, navigate])

  async function handleLogin() {
    try {
      setIsLoading(true)
      setError('')
      const response = await loginAdmin(email, password)
      setSession(response)
      const targetPath =
        typeof location.state?.from === 'string' ? location.state.from : '/admin/quizzes'
      navigate(targetPath, { replace: true })
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Admin login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell
      eyebrow="Admin Access"
      title="Sign in to the Truevindo Games Control Room."
      description="The admin dashboard is used to manage the question bank, launch live sessions, display the waiting room, and control the leaderboard throughout the event."
    >
      <div className="panel-elevated mx-auto max-w-xl p-6">
        <div className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
              Email
            </label>
            <input
              id="admin-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="brand-input"
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-700">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="brand-input"
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <div className="notice-danger rounded-3xl px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="brand-button-primary w-full disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Sign in to Dashboard'}
          </button>
          <p className="text-xs leading-6 text-slate-700">
            Default demo credentials: `admin@truevindo.games` / `demo-password`
          </p>
        </div>
      </div>
    </AppShell>
  )
}
