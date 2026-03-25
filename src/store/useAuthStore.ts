import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateExpiresAt, isSessionExpired } from '@/lib/auth-session'

interface User {
  id: string
  username: string
  role: string
  projectId?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isHydrated: boolean
  expiresAt: number | null
  login: (user: User, expiresInSeconds: number) => void
  logout: () => void
  setHydrated: () => void
  syncSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      expiresAt: null,
      login: (user, expiresInSeconds) =>
        set({
          user,
          isAuthenticated: true,
          expiresAt: calculateExpiresAt(expiresInSeconds),
        }),
      logout: () => set({ user: null, isAuthenticated: false, expiresAt: null }),
      setHydrated: () => set({ isHydrated: true }),
      syncSession: () =>
        set((state) => {
          const hasValidSession =
            !!state.user && !!state.expiresAt && !isSessionExpired(state.expiresAt)

          if (!hasValidSession) {
            return {
              user: null,
              isAuthenticated: false,
              expiresAt: null,
            }
          }

          return {
            isAuthenticated: true,
          }
        }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.syncSession()
        state?.setHydrated()
      },
    }
  )
)
