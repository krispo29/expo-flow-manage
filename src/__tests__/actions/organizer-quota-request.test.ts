import api from '@/lib/api'
import {
  approveOrganizerQuotaRequest,
  getOrganizerQuotaRequests,
  rejectOrganizerQuotaRequest,
  undoOrganizerQuotaRequest,
} from '@/app/actions/organizer-quota-request'
import { cookies } from 'next/headers'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unknown error',
}))
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const get = api.get as jest.MockedFunction<typeof api.get>
const put = api.put as jest.MockedFunction<typeof api.put>

beforeEach(() => {
  jest.clearAllMocks()
  ;(cookies as jest.MockedFunction<typeof cookies>).mockResolvedValue({
    get: jest.fn((name: string) => ({ value: name === 'access_token' ? 'organizer-token' : 'ORGANIZER' })),
  } as never)
})

test('Organizer quota actions use the organizer endpoint without a project header', async () => {
  get.mockResolvedValue({ data: { data: [] } })
  put.mockResolvedValue({ data: {} })

  await getOrganizerQuotaRequests()
  await approveOrganizerQuotaRequest('request-1')
  await rejectOrganizerQuotaRequest('request-1', 'Not available')
  await undoOrganizerQuotaRequest('request-1')

  expect(get).toHaveBeenCalledWith('/v1/organizer/quota-requests', {
    headers: { Authorization: 'Bearer organizer-token' },
  })
  expect(put).toHaveBeenNthCalledWith(1, '/v1/organizer/quota-requests/request-1/approve', {}, {
    headers: { Authorization: 'Bearer organizer-token' },
  })
  expect(put).toHaveBeenNthCalledWith(2, '/v1/organizer/quota-requests/request-1/reject', { note: 'Not available' }, {
    headers: { Authorization: 'Bearer organizer-token' },
  })
  expect(put).toHaveBeenNthCalledWith(3, '/v1/organizer/quota-requests/request-1/undo', {}, {
    headers: { Authorization: 'Bearer organizer-token' },
  })
})
