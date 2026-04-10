import api from '@/lib/api'
import { getDashboard } from '@/app/actions/dashboard'
import { cookies } from 'next/headers'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('dashboard actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockReset()
  })

  it('should return unauthorized without calling API when access token is missing', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue(undefined),
    }
    mockCookies.mockResolvedValue(mockCookieStore as any)

    const result = await getDashboard('project-123')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('should return dashboard data when access token exists', async () => {
    const mockCookieStore = {
      get: jest.fn((name: string) => {
        if (name === 'access_token') return { value: 'token-123' }
        if (name === 'project_uuid') return { value: 'project-123' }
        return undefined
      }),
    }
    mockCookies.mockResolvedValue(mockCookieStore as any)
    mockApiGet.mockResolvedValue({
      data: {
        data: {
          summary: {
            total_exhibitors: 1,
            total_participants: 2,
            total_conferences: 3,
            total_rooms: 4,
            attendee_types: [],
          },
          recent_participants: [],
          conferences: [],
        },
      },
    })

    const result = await getDashboard('project-123')

    expect(result).toEqual({
      success: true,
      data: {
        summary: {
          total_exhibitors: 1,
          total_participants: 2,
          total_conferences: 3,
          total_rooms: 4,
          attendee_types: [],
        },
        recent_participants: [],
        conferences: [],
      },
    })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/admin/project/dashboard', {
      headers: {
        Authorization: 'Bearer token-123',
        'X-Project-UUID': 'project-123',
      },
    })
  })
})
