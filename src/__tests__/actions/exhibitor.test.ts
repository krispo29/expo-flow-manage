import api from '@/lib/api'
import { createExhibitor, updateExhibitor, type ExhibitorPayload } from '@/app/actions/exhibitor'
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

test('Create/Update send exhibitor profile fields for Admin and Organizer', async () => {
  ;(cookies as jest.MockedFunction<typeof cookies>).mockResolvedValue({
    get: jest.fn((name: string) => ({ value: name === 'project_uuid' ? 'project-1' : 'token' })),
  } as never)
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
