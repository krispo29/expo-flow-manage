import api from '@/lib/api'
import {
  getOrganizerUpgradeRequests,
  reviewOrganizerUpgradeRequest,
} from '@/app/actions/organizer-upgrade-request'
import { getAllAttendeeTypes } from '@/app/actions/participant'
import { getUserRole } from '@/app/actions/auth'
import { revalidatePath } from 'next/cache'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  getErrorMessage: jest.fn((error: unknown) =>
    error instanceof Error ? error.message : 'Unexpected error'
  ),
}))

jest.mock('@/lib/authorization', () => ({
  requireOrganizer: jest.fn().mockResolvedValue({ role: 'ORGANIZER' }),
  requireProjectContext: jest.fn().mockResolvedValue({ role: 'ORGANIZER' }),
}))

jest.mock('@/app/actions/auth', () => ({
  getUserRole: jest.fn(),
}))

jest.mock('@/lib/server-auth', () => ({
  requireServerAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer organizer-token',
    'X-Project-UUID': 'project-123',
  }),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockGetUserRole = getUserRole as jest.MockedFunction<typeof getUserRole>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

describe('organizer upgrade request actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserRole.mockResolvedValue('ORGANIZER')
  })

  it('fetches upgrade requests through the Organizer endpoint', async () => {
    const data = [{ request_uuid: 'request-1', status: 'pending' }]
    mockApiGet.mockResolvedValue({ data: { data } })

    const result = await getOrganizerUpgradeRequests('project-123')

    expect(result).toEqual({ success: true, data })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/organizer/upgrade-requests', {
      headers: {
        Authorization: 'Bearer organizer-token',
        'X-Project-UUID': 'project-123',
      },
    })
  })

  it('reviews a request and revalidates Organizer pages', async () => {
    const payload = { request_uuid: 'request-1', approve: true }
    mockApiPost.mockResolvedValue({ data: { data: { status: 'approved' } } })

    const result = await reviewOrganizerUpgradeRequest('project-123', payload)

    expect(result).toEqual({ success: true, data: { status: 'approved' } })
    expect(mockApiPost).toHaveBeenCalledWith(
      '/v1/organizer/upgrade-requests/review',
      payload,
      {
        headers: {
          Authorization: 'Bearer organizer-token',
          'X-Project-UUID': 'project-123',
        },
      }
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/organizer/upgrade-requests')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/organizer/participants')
  })

  it('loads attendee types through the Organizer endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } })

    await getAllAttendeeTypes('project-123')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/organizer/participants/attendee_types',
      expect.any(Object)
    )
  })
})
