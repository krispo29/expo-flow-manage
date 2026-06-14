import api from '@/lib/api'
import {
  getUpgradeRequests,
  reviewUpgradeRequest,
} from '@/app/actions/upgrade-request'
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
  requireProjectContext: jest.fn().mockResolvedValue({ role: 'ADMIN' }),
}))

jest.mock('@/lib/server-auth', () => ({
  requireServerAuthHeaders: jest.fn().mockResolvedValue({
    Authorization: 'Bearer token-123',
    'X-Project-UUID': 'project-123',
  }),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>

describe('upgrade request actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('fetches upgrade requests with project auth headers', async () => {
    const data = [{ request_uuid: 'request-1', status: 'pending' }]
    mockApiGet.mockResolvedValue({ data: { data } })

    const result = await getUpgradeRequests('project-123')

    expect(result).toEqual({ success: true, data })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/upgrade-requests',
      {
        headers: {
          Authorization: 'Bearer token-123',
          'X-Project-UUID': 'project-123',
        },
      }
    )
  })

  it('submits the confirmed review payload and revalidates affected pages', async () => {
    mockApiPost.mockResolvedValue({ data: { data: { status: 'approved' } } })
    const payload = {
      request_uuid: 'request-1',
      approve: true,
      target_type_code: 'BY',
      note: 'Qualified buyer',
    }

    const result = await reviewUpgradeRequest('project-123', payload)

    expect(result).toEqual({
      success: true,
      data: { status: 'approved' },
    })
    expect(mockApiPost).toHaveBeenCalledWith(
      '/v1/admin/project/upgrade-requests/review',
      payload,
      {
        headers: {
          Authorization: 'Bearer token-123',
          'X-Project-UUID': 'project-123',
        },
      }
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/upgrade-requests')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/participants')
  })

  it('returns the normalized API error', async () => {
    mockApiPost.mockRejectedValue(new Error('Request already reviewed'))

    const result = await reviewUpgradeRequest('project-123', {
      request_uuid: 'request-1',
      approve: false,
    })

    expect(result).toEqual({
      success: false,
      error: 'Request already reviewed',
    })
  })
})
