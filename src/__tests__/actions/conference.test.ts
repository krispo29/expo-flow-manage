import api from '@/lib/api'
import { getConferences, getConferenceById, getConferenceLogs, getProjectShowDates, getRooms, createConference, updateConference } from '@/app/actions/conference'
import { cookies } from 'next/headers'

// Mock the API module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockApiPut = api.put as jest.MockedFunction<typeof api.put>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('conference actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockReset()
    mockApiPost.mockReset()
    mockApiPut.mockReset()
  })

  describe('getConferences', () => {
    it('should return conferences successfully', async () => {
      const mockData = [
        { conference_uuid: 'conf-1', title: 'Conference 1' },
        { conference_uuid: 'conf-2', title: 'Conference 2' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockData } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getConferences('project-123')

      expect(result).toEqual({ success: true, data: mockData })
    })

    it('should return error when fetch fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getConferences('project-123')

      expect(result).toEqual({ error: 'Network error' })
    })
  })

  describe('getConferenceById', () => {
    it('should return conference by ID', async () => {
      const mockData = { conference_uuid: 'conf-1', title: 'Conference 1' }
      mockApiGet.mockResolvedValue({ data: { data: mockData } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getConferenceById('conf-1')

      expect(result).toEqual({ success: true, conference: mockData })
    })

    it('should return error when conference not found', async () => {
      mockApiGet.mockRejectedValue(new Error('Not found'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getConferenceById('invalid-id')

      expect(result).toEqual({ error: 'Not found' })
    })
  })

  describe('getConferenceLogs', () => {
    it('should return conference logs', async () => {
      const mockLogs = [
        { log_id: 1, action: 'check-in', attendee_name: 'John Doe' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockLogs } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getConferenceLogs('conf-1')

      expect(result).toEqual({ success: true, data: mockLogs })
    })
  })

  describe('getProjectShowDates', () => {
    it('should return show dates', async () => {
      const mockDates = [
        { label: 'Day 1', value: '2024-06-01' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockDates } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getProjectShowDates()

      expect(result).toEqual({ success: true, data: mockDates })
    })
  })

  describe('getRooms', () => {
    it('should return rooms', async () => {
      const mockRooms = [
        { room_uuid: 'room-1', room_name: 'Main Hall' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockRooms } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await getRooms()

      expect(result).toEqual({ success: true, data: mockRooms })
    })
  })

  describe('createConference', () => {
    it('should create conference successfully', async () => {
      const formData = new FormData()
      formData.append('title', 'New Conference')
      formData.append('speaker_name', 'John Speaker')
      formData.append('speaker_info', 'Speaker info')
      formData.append('show_date', '2024-06-01')
      formData.append('start_time', '09:00')
      formData.append('end_time', '10:00')
      formData.append('location', 'Bangkok')
      formData.append('quota', '100')
      formData.append('conference_type', 'public')
      formData.append('charge_type', 'paid')

      mockApiPost.mockResolvedValue({ data: { code: 201 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await createConference(formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPost).toHaveBeenCalledWith(
        '/v1/admin/project/conferences',
        expect.objectContaining({ charge_type: 'paid' }),
        expect.any(Object)
      )
    })

    it('should return error when creation fails', async () => {
      const formData = new FormData()
      formData.append('title', 'Test')

      mockApiPost.mockRejectedValue(new Error('Validation error'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await createConference(formData)

      expect(result).toEqual({ error: 'Validation error' })
    })
  })

  describe('updateConference', () => {
    it('should update conference successfully', async () => {
      const formData = new FormData()
      formData.append('title', 'Updated Title')
      formData.append('charge_type', 'free')

      mockApiPut.mockResolvedValue({ data: { code: 200 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await updateConference('conf-1', formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPut).toHaveBeenCalledWith(
        '/v1/admin/project/conferences',
        expect.objectContaining({ charge_type: 'free' }),
        expect.any(Object)
      )
    })

    it('should return error when update fails', async () => {
      const formData = new FormData()
      formData.append('title', 'Test')

      mockApiPut.mockRejectedValue(new Error('Update failed'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as any)

      const result = await updateConference('conf-1', formData)

      expect(result).toEqual({ error: 'Update failed' })
    })
  })
})
