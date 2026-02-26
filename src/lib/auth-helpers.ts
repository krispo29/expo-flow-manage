import { AxiosError } from 'axios'

/**
 * Check if an API error indicates an expired or invalid token.
 * Matches: 400 "key incorrect" and 401 Unauthorized.
 * 
 * Note: This is a pure utility function (no 'use server'), so it can be
 * imported from both server actions and other server-side code.
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
