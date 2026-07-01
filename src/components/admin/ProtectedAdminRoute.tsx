import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'

export function ProtectedAdminRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const { accessToken, hasHydrated } = useAdminAuthStore()

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-corporate px-6 text-slate-950">
        <div className="panel-elevated px-6 py-5 text-sm uppercase tracking-[0.25em] text-slate-700">
          Preparing admin access...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
