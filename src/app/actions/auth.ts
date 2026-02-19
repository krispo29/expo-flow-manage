'use server'

import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  try {
    const body = new URLSearchParams({ username, password })
    const response = await fetch(`${API_URL}/auth/c/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const result = await response.json()

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

    return {
      success: true,
      user: {
        id: uuid,
        username,
        role: 'ADMIN',
        com_uuid: com_uuid,
      },
    }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'Unable to connect to server. Please try again.' }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  return { success: true }
}
