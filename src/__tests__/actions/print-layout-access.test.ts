import api from '@/lib/api'
import { getBadgeLayout } from '@/app/actions/badge-layout'
import { printParticipantBadge, printParticipantBadgesBulk } from '@/app/actions/participant'
import { printProjectStaffBadge } from '@/app/actions/staff'

jest.mock('@/lib/api', () => ({ post: jest.fn() }))
jest.mock('@/app/actions/auth', () => ({ getUserRole: jest.fn() }))
jest.mock('@/lib/authorization', () => ({ requireProjectContext: jest.fn() }))
jest.mock('@/app/actions/badge-layout', () => ({ getBadgeLayout: jest.fn() }))
jest.mock('@/lib/server-auth', () => ({ requireServerAuthHeaders: jest.fn().mockResolvedValue({}) }))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

const actions = [
  () => printParticipantBadge('project', 'attendee'),
  () => printParticipantBadgesBulk('project', ['VI001']),
  () => printProjectStaffBadge('project', 'staff'),
]

beforeEach(() => jest.clearAllMocks())

it.each([401, 403])('does not create any print log when layout access returns %s', async status => {
  jest.mocked(getBadgeLayout).mockResolvedValue({ success: false, status, error: 'Access denied' })
  for (const action of actions) {
    expect(await action()).toEqual({ success: false, error: 'Access denied' })
  }
  expect(api.post).not.toHaveBeenCalled()
})

it('keeps the legacy fallback for a temporary server failure', async () => {
  jest.mocked(getBadgeLayout).mockResolvedValue({ success: false, status: 503, error: 'Unavailable' })
  jest.mocked(api.post).mockResolvedValue({ data: { data: {} } })
  for (const action of actions) {
    expect(await action()).toMatchObject({ success: true, layoutState: null })
  }
  expect(api.post).toHaveBeenCalledTimes(3)
  for (const call of jest.mocked(api.post).mock.calls) {
    expect(call[1]).toMatchObject({ print_layout: { layout_revision: 0, layout_source: 'legacy' } })
  }
})
