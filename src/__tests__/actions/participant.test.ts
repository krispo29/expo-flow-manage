import api from '@/lib/api'
import { getParticipants, getParticipantById, createParticipant, updateParticipant, deleteParticipant, importParticipants, exportAttendanceLogs } from '@/app/actions/participant'
import { cookies } from 'next/headers'

// Mock the API module
jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

jest.mock('@/app/actions/auth', () => ({
  getUserRole: jest.fn().mockResolvedValue('ADMIN'),
}))

jest.mock('@/lib/authorization', () => ({
  requireProjectContext: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
}))

jest.mock('@/lib/server-auth', () => ({
  getServerAuthContext: jest.fn().mockResolvedValue({
    accessToken: 'token-123',
    projectUuid: 'project-123',
    userRole: 'ADMIN',
  }),
  requireServerAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer token-123',
    'X-Project-UUID': 'project-123',
  }),
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
const mockApiDelete = api.delete as jest.MockedFunction<typeof api.delete>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

describe('participant actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockReset()
    mockApiPost.mockReset()
    mockApiPut.mockReset()
    mockApiDelete.mockReset()
  })

  describe('getParticipants', () => {
    it('should return list of participants', async () => {
      const mockData = [
        { uuid: 'p-1', first_name: 'John', last_name: 'Doe' },
        { uuid: 'p-2', first_name: 'Jane', last_name: 'Smith' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockData } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await getParticipants('project-123')

      expect(result).toEqual({ success: true, data: mockData })
    })

    it('should return error when fetch fails', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await getParticipants('project-123')

      expect(result).toEqual({ error: 'Network error' })
    })

    it('should filter by query when provided', async () => {
      const mockData = [
        { registration_uuid: 'p-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com', company_name: 'ACME', registration_code: 'R001' },
        { registration_uuid: 'p-2', first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com', company_name: 'ACME', registration_code: 'R002' },
      ]
      mockApiGet.mockResolvedValue({ data: { data: mockData } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await getParticipants('project-123', 'john')

      expect(result.success).toBe(true)
      expect(result.data?.length).toBe(1)
      expect(result.data?.[0].first_name).toBe('John')
    })
  })

  describe('getParticipantById', () => {
    it('should return participant by ID', async () => {
      const mockData = { uuid: 'p-1', first_name: 'John', last_name: 'Doe' }
      mockApiGet.mockResolvedValue({ data: { data: mockData } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await getParticipantById('p-1')

      expect(result).toEqual({ success: true, data: mockData })
    })

    it('should return error when not found', async () => {
      mockApiGet.mockRejectedValue(new Error('Not found'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await getParticipantById('invalid-id')

      expect(result).toEqual({ error: 'Not found' })
    })
  })

  describe('createParticipant', () => {
    it('should create participant successfully', async () => {
      const formData = new FormData()
      formData.append('first_name', 'John')
      formData.append('last_name', 'Doe')
      formData.append('email', 'john@example.com')
      formData.append('describe_your_business', 'Agritech equipment supplier')

      mockApiPost.mockResolvedValue({ data: { code: 201 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await createParticipant(formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPost).toHaveBeenCalledWith(
        '/v1/admin/project/participants',
        expect.objectContaining({
          describe_your_business: 'Agritech equipment supplier',
        }),
        expect.any(Object)
      )
    })

    it('should return error when creation fails', async () => {
      const formData = new FormData()
      formData.append('first_name', 'John')

      mockApiPost.mockRejectedValue(new Error('Validation failed'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await createParticipant(formData)

      expect(result).toEqual({ error: 'Validation failed' })
    })
  })

  describe('updateParticipant', () => {
    it('should update participant successfully', async () => {
      const formData = new FormData()
      formData.append('first_name', 'John Updated')
      formData.append('describe_your_business', 'Updated business profile')

      mockApiPut.mockResolvedValue({ data: { code: 200 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await updateParticipant('p-1', formData)

      expect(result).toEqual({ success: true })
      expect(mockApiPut).toHaveBeenCalledWith(
        '/v1/admin/project/participants',
        expect.objectContaining({
          registration_uuid: 'p-1',
          describe_your_business: 'Updated business profile',
        }),
        expect.any(Object)
      )
    })
  })

  describe('deleteParticipant', () => {
    it('should delete participant successfully', async () => {
      mockApiDelete.mockResolvedValue({ data: { code: 200 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await deleteParticipant('p-1')

      expect(result).toEqual({ success: true })
    })

    it('should return error when deletion fails', async () => {
      mockApiDelete.mockRejectedValue(new Error('Cannot delete'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await deleteParticipant('p-1')

      expect(result).toEqual({ error: 'Cannot delete' })
    })
  })

  describe('importParticipants', () => {
    it('should import participants successfully', async () => {
      const participants = [
        { 
          event_uuid: 'e-1',
          title: 'Mr',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'ACME',
          job_position: 'Developer',
          residence_country: 'TH',
          mobile_country_code: '+66',
          mobile_number: '12345678',
          email: 'john@example.com',
          attendee_type_code: 'VIP'
        },
      ]

      mockApiPost.mockResolvedValue({ data: { code: 201 } })

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await importParticipants(participants)

      expect(result).toEqual({ success: true, count: 1 })
    })

    it('should handle partial failures', async () => {
      const participants = [
        { 
          event_uuid: 'e-1',
          title: 'Mr',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'ACME',
          job_position: 'Developer',
          residence_country: 'TH',
          mobile_country_code: '+66',
          mobile_number: '12345678',
          email: 'john@example.com',
          attendee_type_code: 'VIP'
        },
        { 
          event_uuid: 'e-1',
          title: 'Ms',
          first_name: 'Jane',
          last_name: 'Smith',
          company_name: 'ACME',
          job_position: 'Manager',
          residence_country: 'TH',
          mobile_country_code: '+66',
          mobile_number: '87654321',
          email: 'jane@example.com',
          attendee_type_code: 'VIP'
        },
      ]

      // First call succeeds, second fails
      mockApiPost
        .mockResolvedValueOnce({ data: { code: 201 } })
        .mockRejectedValueOnce(new Error('Duplicate'))

      const mockCookieStore = {
        get: jest.fn().mockReturnValue({ value: 'token-123' }),
      }
      mockCookies.mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>)

      const result = await importParticipants(participants)

      expect(result).toEqual({ success: true, count: 1 })
    })
  })

  describe('exportAttendanceLogs', () => {
    it('should export attendance logs with the expected GET endpoint', async () => {
      const bytes = new Uint8Array([1, 2, 3])
      mockApiGet.mockResolvedValue({
        data: bytes.buffer,
        headers: {
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      })

      const result = await exportAttendanceLogs('project-123')

      expect(result).toEqual({
        success: true,
        data: new Uint8Array(bytes.buffer),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      expect(mockApiGet).toHaveBeenCalledWith(
        '/v1/admin/project/participants/attendance_logs/export-excel',
        expect.objectContaining({
          responseType: 'arraybuffer',
        })
      )
    })
  })
})
