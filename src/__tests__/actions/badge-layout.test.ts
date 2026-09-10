import api from '@/lib/api'
import { copyBadgeLayoutDraft } from '@/app/actions/badge-layout'
import { requireServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'
import { getStarterLayout } from '@/lib/badge-layout/templates'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { request: jest.fn() },
}))
jest.mock('@/lib/server-auth', () => ({
  requireServerAuthContext: jest.fn(),
  requireServerAuthHeaders: jest.fn(),
}))

const mockApiRequest = api.request as jest.MockedFunction<typeof api.request>
const mockRequireAuth = requireServerAuthContext as jest.MockedFunction<
  typeof requireServerAuthContext
>
const mockRequireHeaders = requireServerAuthHeaders as jest.MockedFunction<
  typeof requireServerAuthHeaders
>

const layout = getStarterLayout('PH')
const state = {
  projectUuid: 'project-two',
  projectCode: 'THAILAB2026',
  draft: layout,
  draftRevision: 2,
  published: null,
  publishedRevision: 0,
  publishedAt: null,
  publishedBy: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireHeaders.mockResolvedValue({
    Authorization: 'Bearer token',
    'X-Project-UUID': 'project-two',
  })
})

it('rejects cross-project copy for organizers before making an API request', async () => {
  mockRequireAuth.mockResolvedValue({
    accessToken: 'token',
    projectUuid: 'project-one',
    userRole: 'ORGANIZER',
  })

  const result = await copyBadgeLayoutDraft('project-one', 'project-two', 0, layout)

  expect(result).toEqual({
    success: false,
    error: 'Only administrators can copy layouts between projects.',
  })
  expect(mockApiRequest).not.toHaveBeenCalled()
})

it('saves the copied layout as a destination draft without publishing', async () => {
  mockRequireAuth.mockResolvedValue({
    accessToken: 'token',
    projectUuid: 'project-one',
    userRole: 'ADMIN',
  })
  mockApiRequest.mockResolvedValue({ data: { data: state } })

  const result = await copyBadgeLayoutDraft('project-one', 'project-two', 1, layout)

  expect(result).toEqual({ success: true, state })
  expect(mockApiRequest).toHaveBeenCalledWith({
    url: '/v1/admin/project/badge-layout/draft',
    method: 'put',
    data: { expectedDraftRevision: 1, layout },
    timeout: 10000,
    headers: {
      Authorization: 'Bearer token',
      'X-Project-UUID': 'project-two',
    },
  })
})
