import api from '@/lib/api'
import { loginAction, logoutAction, organizerLoginAction, setProjectCookie, getUserRole } from '@/app/actions/auth'
import { cookies } from 'next/headers'

// Mock the API module
jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}))

const mockApiPost = api.post as jest.MockedFunction<typeof api.post>

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('auth actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiPost.mockReset()
  })

  describe('getUserRole', () => {
    it('should return user role from cookie', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'ORGANIZER' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getUserRole()

      expect(result).toBe('ORGANIZER')
    })

    it('should return ADMIN as default when no cookie', async () => {
      const mockCookieStore = {
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getUserRole()

      expect(result).toBe('ADMIN')
    })
  })

  describe('loginAction', () => {
    it('should return error when username is missing', async () => {
      const formData = new FormData()
      formData.append('password', 'password123')

      const result = await loginAction(formData)

      expect(result).toEqual({ error: 'Username and password are required' })
    })

    it('should return error when password is missing', async () => {
      const formData = new FormData()
      formData.append('username', 'admin')

      const result = await loginAction(formData)

      expect(result).toEqual({ error: 'Username and password are required' })
    })

    it('should return error when credentials are invalid', async () => {
      const formData = new FormData()
      formData.append('username', 'admin')
      formData.append('password', 'wrongpassword')

      // Mock API to return error response
      mockApiPost.mockResolvedValue({
        data: { code: 401, message: 'Invalid username or password' }
      })

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await loginAction(formData)

      expect(result).toEqual({ error: 'Invalid username or password' })
    })

    it('should login successfully with valid credentials', async () => {
      const formData = new FormData()
      formData.append('username', 'admin')
      formData.append('password', 'password123')

      // Mock API to return success response
      mockApiPost.mockResolvedValue({
        data: {
          code: 200,
          data: {
            access_token: 'mock-admin-token',
            uuid: 'admin-123',
            com_uuid: 'company-456',
            expires_in: 604800
          }
        }
      })

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await loginAction(formData)

      expect(result).toEqual({
        success: true,
        user: {
          id: 'admin-123',
          username: 'admin',
          role: 'ADMIN',
          com_uuid: 'company-456',
        },
      })
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2)
    })
  })

  describe('organizerLoginAction', () => {
    it('should return error when username is missing', async () => {
      const formData = new FormData()
      formData.append('password', 'password123')

      const result = await organizerLoginAction(formData)

      expect(result).toEqual({ error: 'Username and password are required' })
    })

    it('should return error for invalid credentials', async () => {
      const formData = new FormData()
      formData.append('username', 'organizer')
      formData.append('password', 'wrongpassword')

      // Mock API to return error response
      mockApiPost.mockResolvedValue({
        data: { code: 401, message: 'Invalid username or password' }
      })

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await organizerLoginAction(formData)

      expect(result).toEqual({ error: 'Invalid username or password' })
    })

    it('should login successfully as organizer', async () => {
      const formData = new FormData()
      formData.append('username', 'organizer')
      formData.append('password', 'password123')

      // Mock API to return success response
      mockApiPost.mockResolvedValue({
        data: {
          code: 200,
          data: {
            access_token: 'mock-organizer-token',
            organizer_uuid: 'organizer-123',
            project_uuid: 'project-456',
            expires_in: 604800
          }
        }
      })

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await organizerLoginAction(formData)

      expect(result).toEqual({
        success: true,
        user: {
          id: 'organizer-123',
          username: 'organizer',
          role: 'ORGANIZER',
          projectId: 'project-456',
        },
      })
      expect(mockCookieStore.set).toHaveBeenCalledTimes(3)
    })
  })

  describe('logoutAction', () => {
    it('should delete all auth cookies', async () => {
      const mockCookieStore = {
        delete: jest.fn(),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await logoutAction()

      expect(result).toEqual({ success: true })
      expect(mockCookieStore.delete).toHaveBeenCalledWith('access_token')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('project_uuid')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('user_role')
    })
  })

  describe('setProjectCookie', () => {
    it('should set project UUID cookie', async () => {
      const mockCookieStore = {
        set: jest.fn(),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await setProjectCookie('project-123')

      expect(result).toEqual({ success: true })
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'project_uuid',
        'project-123',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 604800,
          path: '/',
        })
      )
    })
  })
})
