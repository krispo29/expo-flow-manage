import api from '@/lib/api'
import { createOrganizerConference, updateOrganizerConference } from '@/app/actions/organizer-conference'
import { cookies } from 'next/headers'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unknown error',
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockApiPut = api.put as jest.MockedFunction<typeof api.put>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('organizer conference actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiPost.mockReset()
    mockApiPut.mockReset()

    const mockCookieStore = {
      get: jest.fn((name: string) => {
        if (name === 'access_token') return { value: 'token-123' }
        if (name === 'project_uuid') return { value: 'project-123' }
        return undefined
      }),
    }

    mockCookies.mockResolvedValue(mockCookieStore as never)
  })

  describe('createOrganizerConference', () => {
    it('should send charge_type when creating organizer conference', async () => {
      const formData = new FormData()
      formData.append('title', 'New Conference')
      formData.append('event_uuid', 'event-1')
      formData.append('show_date', '2024-06-01')
      formData.append('start_time', '09:00')
      formData.append('end_time', '10:00')
      formData.append('location', 'room-1')
      formData.append('quota', '100')
      formData.append('conference_type', 'public')
      formData.append('charge_type', 'paid')
      formData.append('speakers', JSON.stringify([{ speaker_name: 'John Speaker' }]))

      mockApiPost.mockResolvedValue({ data: { code: 201 } })

      const result = await createOrganizerConference(formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPost).toHaveBeenCalledWith(
        '/v1/organizer/conferences',
        expect.objectContaining({ charge_type: 'paid' }),
        expect.any(Object)
      )
    })
  })

  describe('updateOrganizerConference', () => {
    it('should send charge_type when updating organizer conference', async () => {
      const formData = new FormData()
      formData.append('title', 'Updated Conference')
      formData.append('conference_type', 'private')
      formData.append('charge_type', 'free')
      formData.append('speakers', JSON.stringify([{ speaker_name: 'Jane Speaker' }]))

      mockApiPut.mockResolvedValue({ data: { code: 200 } })

      const result = await updateOrganizerConference('conf-1', formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPut).toHaveBeenCalledWith(
        '/v1/organizer/conferences/conf-1',
        expect.objectContaining({ charge_type: 'free' }),
        expect.any(Object)
      )
    })
  })
})
