import api from '@/lib/api'
import { cookies } from 'next/headers'
import {
  createInvitation,
  exportInvitations,
  getEvents,
  getInvitations,
  updateInvitation,
} from '@/app/actions/settings'
import { exportOrganizerInvitations, getOrganizerInvitations } from '@/app/actions/organizer-invitation'
import { importInviteCodes } from '@/app/actions/import'

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
const mockApiPost = api.post as jest.MockedFunction<typeof api.post>
const mockApiPut = api.put as jest.MockedFunction<typeof api.put>
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
    mockApiPost.mockReset()
    mockApiPut.mockReset()
    mockCookies.mockResolvedValue(createCookieStore() as never)
  })

  it('gets invitation events from the admin endpoint for the selected project', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } } as never)

    await getEvents('project-456')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/events',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Project-UUID': 'project-456',
          Authorization: 'Bearer token-123',
        }),
      }),
    )
  })

  it('gets all admin invitations without an event query', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } } as never)

    await getInvitations('project-456')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/invitations',
      expect.not.objectContaining({ params: expect.anything() }),
    )
  })

  it('gets admin invitations for a selected event', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } } as never)

    await getInvitations('project-456', 'event-123')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/invitations',
      expect.objectContaining({ params: { event_uuid: 'event-123' } }),
    )
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

  it('exports admin invitations for a selected event', async () => {
    const buffer = new Uint8Array([1]).buffer
    mockApiGet.mockResolvedValue({ data: buffer, headers: {} } as never)

    await exportInvitations('project-456', 'event-123')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/invitations/export-excel',
      expect.objectContaining({ params: { event_uuid: 'event-123' } }),
    )
  })

  it('creates an invitation with an empty event UUID', async () => {
    mockApiPost.mockResolvedValue({} as never)

    await createInvitation('project-456', {
      company_name: 'The Deft',
      event_uuid: '',
    })

    expect(mockApiPost).toHaveBeenCalledWith(
      '/v1/admin/project/invitations',
      { company_name: 'The Deft', event_uuid: '' },
      expect.any(Object),
    )
  })

  it('updates an invitation with an empty event UUID', async () => {
    mockApiPut.mockResolvedValue({} as never)

    await updateInvitation('project-456', {
      invite_uuid: 'invite-1',
      event_uuid: '',
      company_name: 'The Deft',
      invite_code: 'ABC123',
      is_active: true,
    })

    expect(mockApiPut).toHaveBeenCalledWith(
      '/v1/admin/project/invitations',
      expect.objectContaining({ event_uuid: '' }),
      expect.any(Object),
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

  it('gets organizer invitations for a selected event', async () => {
    mockApiGet.mockResolvedValue({ data: { data: [] } } as never)

    await getOrganizerInvitations('event-123')

    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/organizer/invitations',
      expect.objectContaining({
        params: {
          project_uuid: 'project-123',
          event_uuid: 'event-123',
        },
      }),
    )
  })

  it('exports organizer invitations through the organizer export endpoint', async () => {
    const buffer = new Uint8Array([4, 5, 6]).buffer
    mockApiGet.mockResolvedValue({
      data: buffer,
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    } as never)

    const result = await exportOrganizerInvitations('project-789', 'event-123')

    expect(result).toEqual({
      success: true,
      data: new Uint8Array(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/organizer/invitations/export-excel',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Project-UUID': 'project-789',
          Authorization: 'Bearer token-123',
        }),
        params: { event_uuid: 'event-123' },
        responseType: 'arraybuffer',
      }),
    )
  })

  it('forwards an empty event UUID when importing invitation codes', async () => {
    mockApiPost.mockResolvedValue({} as never)
    const formData = new FormData()
    formData.append('file', new Blob(['test']), 'invite-codes.xlsx')
    formData.append('event_uuid', '')

    await importInviteCodes(formData)

    expect(formData.get('event_uuid')).toBe('')
    expect(mockApiPost).toHaveBeenCalledWith(
      '/v1/admin/project/import/invite-codes',
      formData,
      expect.any(Object),
    )
  })
})
