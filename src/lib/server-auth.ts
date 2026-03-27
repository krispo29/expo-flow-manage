import { cookies } from 'next/headers'

const AUTH_COOKIE_NAMES = ['access_token', 'project_uuid', 'user_role'] as const

export async function clearServerAuthCookies(): Promise<void> {
  const cookieStore = await cookies()

  for (const cookieName of AUTH_COOKIE_NAMES) {
    cookieStore.delete(cookieName)
  }
}
