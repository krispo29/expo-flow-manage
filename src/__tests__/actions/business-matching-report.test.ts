import api from '@/lib/api'
import { exportBusinessMatchingCsv, getBusinessMatchingDetails, getBusinessMatchingReport } from '@/app/actions/business-matching-report'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unexpected error',
}))

jest.mock('@/lib/authorization', () => ({ verifyProjectAccess: jest.fn() }))
jest.mock('@/lib/server-auth', () => ({
  getServerAuthContext: jest.fn(),
  requireServerAuthHeaders: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockVerifyProjectAccess = verifyProjectAccess as jest.MockedFunction<typeof verifyProjectAccess>
const mockAuthContext = getServerAuthContext as jest.MockedFunction<typeof getServerAuthContext>
const mockAuthHeaders = requireServerAuthHeaders as jest.MockedFunction<typeof requireServerAuthHeaders>

describe('getBusinessMatchingReport', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockAuthHeaders.mockResolvedValue({ Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' })
  })

  it('uses the organizer cookie project and its default Business Matching event', async () => {
    mockAuthContext.mockResolvedValue({
      accessToken: 'organizer-token',
      projectUuid: 'project-a',
      userRole: 'ORGANIZER',
    })
    mockVerifyProjectAccess.mockResolvedValue(true)
    mockApiGet
      .mockResolvedValueOnce({
        data: { data: { projects: [{
          project_uuid: 'project-a',
          default_event_uuid: 'event-a',
          events: [{ event_uuid: 'event-a', event_name: 'Expo A' }],
        }] } },
      })
      .mockResolvedValueOnce({
        data: { data: {
          project_uuid: 'project-a',
          event_uuid: 'event-a',
          generated_at: '2026-08-13T00:00:00Z',
          totals: { requested: 3 },
        } },
      })

    await expect(getBusinessMatchingReport({ role: 'ORGANIZER', projectId: 'other-project' })).resolves.toMatchObject({
      success: true,
      projectUuid: 'project-a',
      eventUuid: 'event-a',
      summary: { totals: { requested: 3 } },
    })
    expect(mockApiGet).toHaveBeenLastCalledWith('/v1/business-matching/admin/reports/summary', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
      params: { project_uuid: 'project-a', event_uuid: 'event-a' },
    })
  })

  it('rejects an Admin project that fails verifyProjectAccess', async () => {
    mockAuthContext.mockResolvedValue({ accessToken: 'admin-token', userRole: 'ADMIN' })
    mockVerifyProjectAccess.mockResolvedValue(false)

    await expect(getBusinessMatchingReport({ role: 'ADMIN', projectId: 'project-b' })).resolves.toEqual({
      success: false,
      error: 'Unauthorized: Access denied to project project-b',
      events: [],
    })
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('rejects a role that does not match the authenticated session', async () => {
    mockAuthContext.mockResolvedValue({ accessToken: 'admin-token', userRole: 'ADMIN' })

    await expect(getBusinessMatchingReport({ role: 'ORGANIZER' })).resolves.toEqual({
      success: false,
      error: 'Unauthorized',
      events: [],
    })
  })

  it('loads a filtered redemption-code list with the authorized scope', async () => {
    mockAuthContext.mockResolvedValue({ accessToken: 'admin-token', userRole: 'ADMIN' })
    mockVerifyProjectAccess.mockResolvedValue(true)
    mockApiGet
      .mockResolvedValueOnce({
        data: { data: { projects: [{
          project_uuid: 'project-a',
          events: [{ event_uuid: 'event-a', event_name: 'Expo A' }],
        }] } },
      })
      .mockResolvedValueOnce({
        data: { data: { items: [{ stamp_code: 'STAMP-1', status: 'Issued' }], pagination: { total: 1 } } },
      })

    await expect(getBusinessMatchingDetails({
      role: 'ADMIN', projectId: 'project-a', eventId: 'event-a', type: 'redemption-stamps', status: 'Issued', q: 'STAMP', limit: 25, offset: 0,
    })).resolves.toMatchObject({ success: true, items: [{ stamp_code: 'STAMP-1' }] })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/business-matching/admin/reports/redemption-stamps', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
      params: { project_uuid: 'project-a', event_uuid: 'event-a', status: 'Issued', q: 'STAMP', limit: 25, offset: 0 },
    })
  })

  it('exports matching activity through the GET-only report endpoint', async () => {
    mockAuthContext.mockResolvedValue({ accessToken: 'admin-token', userRole: 'ADMIN' })
    mockVerifyProjectAccess.mockResolvedValue(true)
    mockApiGet
      .mockResolvedValueOnce({
        data: { data: { projects: [{
          project_uuid: 'project-a',
          events: [{ event_uuid: 'event-a', event_name: 'Expo A' }],
        }] } },
      })
      .mockResolvedValueOnce({
        data: new Uint8Array([65, 66]),
        headers: { 'content-disposition': 'attachment; filename="match-requests.csv"' },
      })

    await expect(exportBusinessMatchingCsv({
      role: 'ADMIN', projectId: 'project-a', eventId: 'event-a', type: 'match-requests', status: 'Accepted',
    })).resolves.toEqual({ success: true, bytes: [65, 66], filename: 'match-requests.csv' })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/business-matching/admin/reports/match-requests/export.csv', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
      params: { project_uuid: 'project-a', event_uuid: 'event-a', status: 'Accepted' },
      responseType: 'arraybuffer',
    })
  })
})
