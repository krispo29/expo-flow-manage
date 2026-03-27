import api from '@/lib/api'
import { loginAction, logoutAction, organizerLoginAction, setProjectCookie, getUserRole } from '@/app/actions/auth'
import { cookies } from 'next/headers'

// Mock the API module
jest.mock('@/lib/api', () => ({
  post: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  withAuthRateLimit: async <T>(callback: () => Promise<T>) => callback(),
}))

const mockApiPost = api.post as jest.MockedFunction<typeof api.post>

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('auth actions', () => {
  const fixedNow = 1_700_000_000_000

  beforeEach(() => {
    jest.clearAllMocks()
    mockApiPost.mockReset()
    jest.spyOn(Date, 'now').mockReturnValue(fixedNow)
  })

  afterEach(() => {
    jest.restoreAllMocks()
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

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          user: {
            id: 'admin-123',
            username: 'admin',
            role: 'ADMIN',
            com_uuid: 'company-456',
          },
        })
      )
      expect((result as { expiresAt: number }).expiresAt).toBe(fixedNow + 604800 * 1000)
      expect(mockCookieStore.set).toHaveBeenCalledTimes(2)
    })

    it('should use JWT exp to align cookie maxAge when available', async () => {
      const formData = new FormData()
      formData.append('username', 'admin')
      formData.append('password', 'password123')

      const exp = Math.floor(fixedNow / 1000) + 1800
      const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
      const token = `header.${payload}.signature`

      mockApiPost.mockResolvedValue({
        data: {
          code: 200,
          data: {
            access_token: token,
            uuid: 'admin-123',
            com_uuid: 'company-456',
            expires_in: 604800,
          },
        },
      })

      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await loginAction(formData)

      expect((result as { expiresAt: number }).expiresAt).toBe(exp * 1000)
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'access_token',
        token,
        expect.objectContaining({
          maxAge: 1800,
        })
      )
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

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          user: {
            id: 'organizer-123',
            username: 'organizer',
            role: 'ORGANIZER',
            projectId: 'project-456',
          },
        })
      )
      expect((result as { expiresAt: number }).expiresAt).toBe(fixedNow + 604800 * 1000)
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
      const exp = Math.floor(Date.now() / 1000) + 3600
      const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
      const mockToken = `header.${payload}.signature`
      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue({ value: mockToken }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await setProjectCookie('project-123')

      expect(result).toEqual({ success: true })
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        'project_uuid',
        'project-123',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
        })
      )
    })

    it('should return unauthorized when access token is missing', async () => {
      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await setProjectCookie('project-123')

      expect(result).toEqual({ success: false, error: 'Unauthorized' })
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('should return unauthorized when access token is already expired', async () => {
      const expiredExp = Math.floor(fixedNow / 1000) - 10
      const payload = Buffer.from(JSON.stringify({ exp: expiredExp })).toString('base64url')
      const mockToken = `header.${payload}.signature`
      const mockCookieStore = {
        set: jest.fn(),
        get: jest.fn().mockReturnValue({ value: mockToken }),
        delete: jest.fn(),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await setProjectCookie('project-123')

      expect(result).toEqual({ success: false, error: 'Unauthorized' })
      expect(mockCookieStore.set).not.toHaveBeenCalled()
      expect(mockCookieStore.delete).toHaveBeenCalledWith('access_token')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('project_uuid')
      expect(mockCookieStore.delete).toHaveBeenCalledWith('user_role')
    })
  })
})
