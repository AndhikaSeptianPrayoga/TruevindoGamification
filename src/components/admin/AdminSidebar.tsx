import { FerrisWheel, Gamepad2, Keyboard, LayoutDashboard, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'

const items = [
  { to: '/admin/quizzes', label: 'Quiz Library', icon: LayoutDashboard },
  { to: '/admin/wheel', label: 'Wheel of Names', icon: FerrisWheel },
  { to: '/admin/spam', label: 'Spamming Games', icon: Keyboard },
  { to: '/admin/minigames', label: 'Mini Games', icon: Gamepad2 },
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
    <aside className="panel-elevated p-4">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <p className="kicker text-accent">Truevindo Games</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950">Control Room</h2>
        <p className="mt-3 text-sm text-slate-700">{user?.fullName ?? 'Admin Session'}</p>
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
                active
                  ? 'bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]'
                  : 'text-slate-600 hover:bg-white hover:text-slate-950'
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
        className="brand-button-ghost mt-6 flex w-full"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout Admin</span>
      </button>
    </aside>
  )
}
