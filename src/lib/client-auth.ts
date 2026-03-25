'use client'

import { clearAuthStorage } from '@/lib/auth-storage'
import { useAuthStore } from '@/store/useAuthStore'

export function clearClientAuthState(): void {
  useAuthStore.getState().logout()
  clearAuthStorage()
}
