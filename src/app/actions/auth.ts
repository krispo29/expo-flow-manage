'use server'

import { mockService } from '@/lib/mock-service'


export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: 'Username and password are required' }
  }

  try {
    const user = await mockService.findUserByUsername(username)

    if (!user) {
      return { error: 'Invalid username or password' }
    }

    // In a real app, use bcrypt.compare. For mock, we can just check directly or rely on the mock service logic.
    // For now, let's keep it simple and assume the password storage in mock service is plaintext or we simulate comparison.
    // Since we initialized mock user with 'password' (hashed in real life, but here for simplicity let's match string)
    // If you want to simulate real auth:
    // const isValid = await bcrypt.compare(password, user.password)
    
    // For the specific requested mock "admin" / "password"
    if (user && password === user.password) {
         return {
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        }
    }
     
    return { error: 'Invalid username or password' }

  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred' }
  }
}
