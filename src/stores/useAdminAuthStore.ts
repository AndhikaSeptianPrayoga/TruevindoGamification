import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface AdminAuthUser {
  id: string
  fullName: string
  email: string
  role: string
}

interface AdminAuthState {
  accessToken: string | null
  user: AdminAuthUser | null
  hasHydrated: boolean
  setSession: (payload: { accessToken: string; user: AdminAuthUser }) => void
  clearSession: () => void
  setHydrated: (value: boolean) => void
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
      setHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'truevindo-admin-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    },
  ),
)
