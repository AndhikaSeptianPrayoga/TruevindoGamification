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
      description="The admin dashboard is used to manage the question bank, create live sessions, display the waiting room, and control the leaderboard throughout the event."
    >
      <div className="mx-auto max-w-xl rounded-[32px] border border-white/10 bg-white/5 p-6">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">
              Email
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-white outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-slate-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-3xl border border-white/10 bg-ink/80 px-5 py-4 text-white outline-none focus:border-accent"
            />
          </div>
          {error ? (
            <div className="rounded-3xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoading || !email || !password}
            className="w-full rounded-3xl bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-slate-100 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Sign in to Dashboard'}
          </button>
          <p className="text-xs leading-6 text-slate-400">
            Default demo credentials: `admin@truevindo.games` / `demo-password`
          </p>
        </div>
      </div>
    </AppShell>
  )
}
