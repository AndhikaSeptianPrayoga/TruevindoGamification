import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'

export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { accessToken, hasHydrated } = useAdminAuthStore()

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate px-6 text-white">
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-6 py-5 text-sm uppercase tracking-[0.25em] text-slate-300">
          Menyiapkan akses admin...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
