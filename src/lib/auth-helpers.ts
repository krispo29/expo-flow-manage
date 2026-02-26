'use server'

import { cookies } from 'next/headers'
import { AxiosError } from 'axios'

/**
 * Check if an API error indicates an expired or invalid token.
 * Matches: 400 "key incorrect" and 401 Unauthorized.
 */
export function isTokenExpiredError(error: AxiosError<{ message?: string }>): boolean {
  if (!error?.response) return false

  const status = error.response.status
  const message = error.response.data?.message

  // 400 "key incorrect" — backend's way of saying token is invalid
  if (status === 400 && message === 'key incorrect') return true

  // 401 Unauthorized
  if (status === 401) return true

  return false
}

/**
 * Clear all auth-related cookies. Call this when token is expired/invalid.
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('project_uuid')
  cookieStore.delete('user_role')
}
