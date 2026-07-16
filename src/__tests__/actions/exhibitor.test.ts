import api from '@/lib/api'
import { createExhibitor, presignExhibitorImage, updateExhibitor, type ExhibitorPayload } from '@/app/actions/exhibitor'
import { createOrganizerExhibitor, updateOrganizerExhibitor } from '@/app/actions/organizer-exhibitor'
import { cookies } from 'next/headers'

const THAILAB2026_PROJECT_UUID = '07626a19-001d-4675-addd-3a92e3f46d47'
let currentProjectUuid = 'project-1'

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
  categoryUUIDs: ['category-main', 'category-sub'],
}

beforeEach(() => {
  jest.clearAllMocks()
  currentProjectUuid = 'project-1'
  ;(cookies as jest.MockedFunction<typeof cookies>).mockResolvedValue({
    get: jest.fn((name: string) => ({ value: name === 'project_uuid' ? currentProjectUuid : 'token' })),
  } as never)
})

test('Create/Update send exhibitor profile fields for Admin and Organizer', async () => {
  currentProjectUuid = THAILAB2026_PROJECT_UUID
  post.mockResolvedValue({ data: { data: {} } })
  put.mockResolvedValue({ data: { data: {} } })

  await createExhibitor(THAILAB2026_PROJECT_UUID, payload)
  await createOrganizerExhibitor(payload)
  await updateExhibitor(THAILAB2026_PROJECT_UUID, 'exhibitor-1', payload)
  await updateOrganizerExhibitor('exhibitor-1', payload)

  const fields = {
    company_profile: 'Profile',
    company_logo: 'https://example.com/logo.png',
    product_highlights: [{ description: 'Product', url: 'https://example.com/product.png' }],
    category_uuids: ['category-main', 'category-sub'],
  }
  expect(post).toHaveBeenNthCalledWith(1, '/v1/admin/project/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(post).toHaveBeenNthCalledWith(2, '/v1/organizer/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(put).toHaveBeenNthCalledWith(1, '/v1/admin/project/exhibitors', expect.objectContaining(fields), expect.any(Object))
  expect(put).toHaveBeenNthCalledWith(2, '/v1/organizer/exhibitors', expect.objectContaining(fields), expect.any(Object))
})

test('Create/Update omit categories outside THAILAB2026', async () => {
  post.mockResolvedValue({ data: { data: {} } })
  put.mockResolvedValue({ data: { data: {} } })
  const hiddenPayload: ExhibitorPayload = {
    eventId: 'event-1',
    companyName: 'Expo Co',
    quota: 1,
    overQuota: 0,
    categoryUUIDs: ['category-main', 'category-sub'],
  }

  await createExhibitor('project-1', hiddenPayload)
  await createOrganizerExhibitor(hiddenPayload)
  await updateExhibitor('project-1', 'exhibitor-1', hiddenPayload)
  await updateOrganizerExhibitor('exhibitor-1', hiddenPayload)

  for (const call of [...post.mock.calls, ...put.mock.calls]) {
    expect(call[1]).not.toHaveProperty('company_profile')
    expect(call[1]).not.toHaveProperty('company_logo')
    expect(call[1]).not.toHaveProperty('product_highlights')
    expect(call[1]).not.toHaveProperty('category_uuids')
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
