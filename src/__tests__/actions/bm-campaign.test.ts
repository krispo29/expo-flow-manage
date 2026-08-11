import api from '@/lib/api'
import { THAILAB2026_PROJECT_UUID } from '@/lib/features'
import {
  getBMExhibitorCampaignStatus,
  startBMExhibitorCampaign,
  triggerBMExhibitorCampaignBatchNow,
} from '@/app/actions/bm-exhibitor-campaign'
import {
  getBMVisitorCampaignStatus,
  startBMVisitorCampaign,
  triggerBMVisitorCampaignBatchNow,
} from '@/app/actions/bm-visitor-campaign'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Unknown error',
}))
jest.mock('@/lib/server-auth', () => ({
  requireServerAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Bearer token' }),
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const get = api.get as jest.MockedFunction<typeof api.get>
const post = api.post as jest.MockedFunction<typeof api.post>
const ILDEX2026_PROJECT_UUID = '67597e81-db17-4ff0-8479-56f737d9482a'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

test('BM campaign actions reject projects other than THAILAB2026 before calling the API', async () => {
  const results = await Promise.all([
    getBMExhibitorCampaignStatus(ILDEX2026_PROJECT_UUID),
    startBMExhibitorCampaign(ILDEX2026_PROJECT_UUID),
    triggerBMExhibitorCampaignBatchNow(ILDEX2026_PROJECT_UUID, 10, 15),
    getBMVisitorCampaignStatus(ILDEX2026_PROJECT_UUID),
    startBMVisitorCampaign(ILDEX2026_PROJECT_UUID),
    triggerBMVisitorCampaignBatchNow(ILDEX2026_PROJECT_UUID, 10, 15),
  ])

  expect(results.every((result) => !result.success)).toBe(true)
  expect(get).not.toHaveBeenCalled()
  expect(post).not.toHaveBeenCalled()
})

test('BM campaign actions permit THAILAB2026', async () => {
  get.mockResolvedValue({ data: { data: {} } })
  post.mockResolvedValue({ data: { data: {} } })

  await expect(
    getBMExhibitorCampaignStatus(THAILAB2026_PROJECT_UUID)
  ).resolves.toMatchObject({ success: true })
  await expect(
    startBMVisitorCampaign(THAILAB2026_PROJECT_UUID)
  ).resolves.toMatchObject({ success: true })

  expect(get).toHaveBeenCalledTimes(1)
  expect(post).toHaveBeenCalledTimes(1)
})

test('Send Now saves the supplied batch settings before triggering a campaign', async () => {
  post.mockResolvedValue({ data: { data: {} } })

  await triggerBMExhibitorCampaignBatchNow(THAILAB2026_PROJECT_UUID, 10, 15)
  await triggerBMVisitorCampaignBatchNow(THAILAB2026_PROJECT_UUID, 10, 15)

  expect(post).toHaveBeenNthCalledWith(
    1,
    expect.stringContaining(
      'business_matching_exhibitor_ready_campaign/trigger_batch'
    ),
    { batch_size: 10, interval_minutes: 15 },
    expect.any(Object)
  )
  expect(post).toHaveBeenNthCalledWith(
    2,
    '/v1/admin/project/business_matching_visitor_ready_campaign/trigger_batch',
    {
      project_uuid: THAILAB2026_PROJECT_UUID,
      batch_size: 10,
      interval_minutes: 15,
    },
    expect.any(Object)
  )
})
