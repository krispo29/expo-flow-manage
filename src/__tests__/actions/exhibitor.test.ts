import api from '@/lib/api'
import { createExhibitor, presignExhibitorImage, updateExhibitor, type ExhibitorPayload } from '@/app/actions/exhibitor'
import { createOrganizerExhibitor, updateOrganizerExhibitor } from '@/app/actions/organizer-exhibitor'
import { cookies } from 'next/headers'

jest.mock('@/lib/api', () => ({
  post: jest.fn(),
  put: jest.fn(),
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unknown error',
}))
jest.mock('next/headers', () => ({ cookies: jest.fn() }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const post = api.post as jest.MockedFunction<typeof api.post>
const put = api.put as jest.MockedFunction<typeof api.put>
const payload: ExhibitorPayload = {
  eventId: 'event-1',
  companyName: 'Expo Co',
  quota: 1,
  overQuota: 0,
  companyProfile: 'Profile',
  companyLogo: 'https://example.com/logo.png',
  productHighlights: [{ description: 'Product', url: 'https://example.com/product.png' }],
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(cookies as jest.MockedFunction<typeof cookies>).mockResolvedValue({
    get: jest.fn((name: string) => ({ value: name === 'project_uuid' ? 'project-1' : 'token' })),
  } as never)
})

test('Create/Update send exhibitor profile fields for Admin and Organizer', async () => {
  post.mockResolvedValue({ data: { data: {} } })
  put.mockResolvedValue({ data: { data: {} } })

  await createExhibitor('project-1', payload)
  await createOrganizerExhibitor(payload)
  await updateExhibitor('project-1', 'exhibitor-1', payload)
  await updateOrganizerExhibitor('exhibitor-1', payload)

  const fields = {
    company_profile: 'Profile',
    company_logo: 'https://example.com/logo.png',
    product_highlights: [{ description: 'Product', url: 'https://example.com/product.png' }],
  }
  expect(post).toHaveBeenNthCalledWith(1, '/v1/admin/project/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(post).toHaveBeenNthCalledWith(2, '/v1/organizer/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(put).toHaveBeenNthCalledWith(1, '/v1/admin/project/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(put).toHaveBeenNthCalledWith(2, '/v1/organizer/exhibitors', expect.objectContaining(fields), expect.any(Object))
})

test('Create/Update omit exhibitor profile fields when disabled', async () => {
  post.mockResolvedValue({ data: { data: {} } })
  put.mockResolvedValue({ data: { data: {} } })
  const hiddenPayload = {
    eventId: 'event-1',
    companyName: 'Expo Co',
    quota: 1,
    overQuota: 0,
  }

  await createExhibitor('project-1', hiddenPayload)
  await createOrganizerExhibitor(hiddenPayload)
  await updateExhibitor('project-1', 'exhibitor-1', hiddenPayload)
  await updateOrganizerExhibitor('exhibitor-1', hiddenPayload)

  for (const call of [...post.mock.calls, ...put.mock.calls]) {
    expect(call[1]).not.toHaveProperty('company_profile')
    expect(call[1]).not.toHaveProperty('company_logo')
    expect(call[1]).not.toHaveProperty('product_highlights')
  }
})

test('Presign image upload uses shared exhibitor endpoint', async () => {
  post.mockResolvedValue({ data: { data: { upload_url: 'https://gcs/upload', file_url: 'https://cdn/logo.jpg' } } })

  const result = await presignExhibitorImage('project-1', { filename: 'logo.jpg', contentType: 'image/jpeg' })

  expect(result).toEqual({ success: true, uploadUrl: 'https://gcs/upload', fileUrl: 'https://cdn/logo.jpg' })
  expect(post).toHaveBeenCalledWith(
    '/v1/exhibitor/upload/presign',
    { filename: 'logo.jpg', content_type: 'image/jpeg' },
    { headers: expect.objectContaining({ Authorization: 'Bearer token', 'X-Project-UUID': 'project-1' }) },
  )
})
