'use server'

import { cookies } from 'next/headers'
import api from '@/lib/api'

export async function getUserRole(): Promise<string> {
  const cookieStore = await cookies()
  return cookieStore.get('user_role')?.value || 'ADMIN'
}

export async function loginAction(formData: FormData) {
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

    const { access_token, uuid, com_uuid } = result.data

    // Store access token in HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.data.expires_in || 604800,
      path: '/',
    })

    // Store user role in cookie for server-side role detection
    cookieStore.set('user_role', 'ADMIN', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.data.expires_in || 604800,
      path: '/',
    })

    return {
      success: true,
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
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('project_uuid')
  cookieStore.delete('user_role')
  return { success: true }
}

export async function organizerLoginAction(formData: FormData) {
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

    const { access_token, organizer_uuid, project_uuid } = result.data

    // Store access token in HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.data.expires_in || 604800,
      path: '/',
    })

    // Store user role in cookie for server-side role detection
    cookieStore.set('user_role', 'ORGANIZER', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.data.expires_in || 604800,
      path: '/',
    })

    // Store project UUID from organizer's assigned project
    cookieStore.set('project_uuid', project_uuid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.data.expires_in || 604800,
      path: '/',
    })

    return {
      success: true,
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
}

export async function setProjectCookie(projectUuid: string) {
  const cookieStore = await cookies()
  cookieStore.set('project_uuid', projectUuid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 604800, // 7 days
    path: '/',
  })
  return { success: true }
}
