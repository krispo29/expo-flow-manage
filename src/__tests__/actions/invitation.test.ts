import api from '@/lib/api'
import { cookies } from 'next/headers'
import { exportInvitations } from '@/app/actions/settings'
import { exportOrganizerInvitations, getOrganizerInvitations } from '@/app/actions/organizer-invitation'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockCookies = cookies as jest.MockedFunction<typeof cookies>

function createCookieStore() {
  return {
    get: jest.fn((name: string) => {
      if (name === 'access_token') return { value: 'token-123' }
      if (name === 'project_uuid') return { value: 'project-123' }
      return undefined
    }),
  }
}

describe('invitation actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockReset()
    mockCookies.mockResolvedValue(createCookieStore() as never)
  })

  it('exports admin invitations as an excel buffer', async () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer
    mockApiGet.mockResolvedValue({
      data: buffer,
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    } as never)

    const result = await exportInvitations('project-456')

    expect(result).toEqual({
      success: true,
      data: new Uint8Array(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/invitations/export-excel',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Project-UUID': 'project-456',
          Authorization: 'Bearer token-123',
        }),
        responseType: 'arraybuffer',
      }),
    )
  })

  it('gets organizer invitations from the organizer endpoint', async () => {
    const invitations = [
      { invite_uuid: 'invite-1', company_name: 'The Deft', invite_code: 'ABC123', invite_link: 'https://example.com', is_active: true },
    ]
    mockApiGet.mockResolvedValue({ data: { data: invitations } } as never)

    const result = await getOrganizerInvitations()

    expect(result).toEqual({ success: true, invitations })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/organizer/invitations',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Project-UUID': 'project-123',
          Authorization: 'Bearer token-123',
        }),
        params: { project_uuid: 'project-123' },
      }),
    )
  })

  it('exports organizer invitations through the admin export endpoint', async () => {
    const buffer = new Uint8Array([4, 5, 6]).buffer
    mockApiGet.mockResolvedValue({
      data: buffer,
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    } as never)

    const result = await exportOrganizerInvitations('project-789')

    expect(result).toEqual({
      success: true,
      data: new Uint8Array(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/invitations/export-excel',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Project-UUID': 'project-789',
          Authorization: 'Bearer token-123',
        }),
        responseType: 'arraybuffer',
      }),
    )
  })
})
