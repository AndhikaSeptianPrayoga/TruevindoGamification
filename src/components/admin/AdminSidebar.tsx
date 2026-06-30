import { LayoutDashboard, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'

const items = [
  { to: '/admin/quizzes', label: 'Quiz Library', icon: LayoutDashboard },
]

export function AdminSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearSession } = useAdminAuthStore()

  function handleLogout() {
    clearSession()
    navigate('/admin/login', { replace: true })
  }

  return (
    <aside className="rounded-[28px] border border-white/10 bg-ink/85 p-4 backdrop-blur">
      <div className="mb-6 border-b border-white/10 pb-4">
        <p className="text-xs uppercase tracking-[0.35em] text-accent">Truevindo</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-white">Control Room</h2>
        <p className="mt-3 text-sm text-slate-300">{user?.fullName ?? 'Admin Session'}</p>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{user?.email}</p>
      </div>
      <nav className="space-y-2">
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to || location.pathname.startsWith(`${to}/`)

          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                active ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout Admin</span>
      </button>
    </aside>
  )
}
