'use server'

import { cookies } from 'next/headers'
import api from '@/lib/api'
import { withAuthRateLimit } from '@/lib/rate-limit'
import { getSessionTiming } from '@/lib/auth-session'
import { clearServerAuthCookies, getServerAuthContext, type ServerUserRole } from '@/lib/server-auth'

export type UserRole = ServerUserRole

export async function getUserRole(): Promise<UserRole | null> {
  const authContext = await getServerAuthContext()
  return authContext?.userRole ?? null
}

export async function loginAction(formData: FormData) {
  try {
    return await withAuthRateLimit(async () => {
      const username = formData.get('username') as string
      const password = formData.get('password') as string

      if (!username || !password) {
        return { error: 'Username and password are required' }
      }

      try {
        const body = new URLSearchParams({ username, password })
        const response = await api.post('/auth/c/signin', body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })

        const result = response.data

        if (result.code !== 200 || !result.data?.access_token) {
          return { error: result.message || 'Invalid username or password' }
        }

        const { access_token, uuid, com_uuid, expires_in } = result.data
        const sessionTiming = getSessionTiming(access_token, expires_in || 604800)

        if (!sessionTiming) {
          await clearServerAuthCookies()
          return { error: 'Invalid access token received from server' }
        }

        // Store access token in HTTP-only cookie with secure settings
        const cookieStore = await cookies()
        cookieStore.set('access_token', access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: sessionTiming.maxAge,
          path: '/',
        })

        // Store user role in cookie for server-side role detection
        cookieStore.set('user_role', 'ADMIN', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: sessionTiming.maxAge,
          path: '/',
        })

        return {
          success: true,
          expiresAt: sessionTiming.expiresAt,
          user: {
            id: uuid,
            username,
            role: 'ADMIN',
            com_uuid: com_uuid,
          },
        }
      } catch (error: any) {
        console.error('Login error:', error)
        const errorMsg = error.response?.data?.message || error.message || 'Unable to connect to server'
        return { error: errorMsg }
      }
    })
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function logoutAction() {
  await clearServerAuthCookies()
  return { success: true }
}

export async function organizerLoginAction(formData: FormData) {
  try {
    return await withAuthRateLimit(async () => {
      const username = formData.get('username') as string
      const password = formData.get('password') as string

      if (!username || !password) {
        return { error: 'Username and password are required' }
      }

    try {
      const body = new URLSearchParams({ username, password })
      const response = await api.post('/auth/organizer/signin', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      const result = response.data

      if (result.code !== 200 || !result.data?.access_token) {
        return { error: result.message || 'Invalid username or password' }
      }

      const { access_token, organizer_uuid, project_uuid, expires_in } = result.data
      const sessionTiming = getSessionTiming(access_token, expires_in || 604800)

      if (!sessionTiming) {
        await clearServerAuthCookies()
        return { error: 'Invalid access token received from server' }
      }

      // Store access token in HTTP-only cookie with secure settings
      const cookieStore = await cookies()
      cookieStore.set('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: sessionTiming.maxAge,
        path: '/',
      })

      // Store user role in cookie for server-side role detection
      cookieStore.set('user_role', 'ORGANIZER', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: sessionTiming.maxAge,
        path: '/',
      })

      // Store project UUID from organizer's assigned project
      cookieStore.set('project_uuid', project_uuid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: sessionTiming.maxAge,
        path: '/',
      })

      return {
        success: true,
        expiresAt: sessionTiming.expiresAt,
        user: {
          id: organizer_uuid,
          username,
          role: 'ORGANIZER',
          projectId: project_uuid,
        },
      }
    } catch (error: any) {
      console.error('Organizer login error:', error)
      const errorMsg = error.response?.data?.message || error.message || 'Unable to connect to server'
      return { error: errorMsg }
    }
    })
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function setProjectCookie(projectUuid: string) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const sessionTiming = getSessionTiming(accessToken)

  if (!accessToken) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!sessionTiming) {
    await clearServerAuthCookies()
    return { success: false, error: 'Unauthorized' }
  }

  cookieStore.set('project_uuid', projectUuid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: sessionTiming.maxAge,
    path: '/',
  })
  return { success: true }
}
