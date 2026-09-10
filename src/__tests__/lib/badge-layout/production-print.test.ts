import { getBadgeLayout } from '@/app/actions/badge-layout'
import { getStoredProjects } from '@/lib/auth-storage'
import { printProjectBadges } from '@/lib/badge-layout/print'
import { renderLayoutPrintWindow } from '@/lib/badge-layout/print-window'
import { printBadges } from '@/utils/print-badge'
import { getStarterLayout } from '@/lib/badge-layout/templates'

jest.mock('@/app/actions/badge-layout', () => ({ getBadgeLayout: jest.fn() }))
jest.mock('@/lib/auth-storage', () => ({ getStoredProjects: jest.fn() }))
jest.mock('@/lib/badge-layout/print-window', () => ({
  renderLayoutPrintWindow: jest.fn(),
}))
jest.mock('@/utils/print-badge', () => ({ printBadges: jest.fn() }))
jest.mock('sonner', () => ({ toast: { warning: jest.fn() } }))
const badge = {
  firstName: 'Alex',
  lastName: 'Example',
  companyName: 'Example',
  country: 'TW',
  registrationCode: 'EX123',
}
const state = {
  projectUuid: 'one',
  projectCode: 'THAILAB2026',
  draft: getStarterLayout('PH'),
  draftRevision: 9,
  published: getStarterLayout('THAILAB2026'),
  publishedRevision: 2,
  publishedAt: null,
  publishedBy: null,
}
const popup = {
  close: jest.fn(),
  document: { open: jest.fn() },
} as unknown as Window
beforeEach(() => {
  jest.clearAllMocks()
  jest
    .mocked(getStoredProjects)
    .mockReturnValue([
      {
        project_uuid: 'one',
        project_code: 'THAILAB2026',
        project_name: 'Test',
      },
    ])
})

it('fetches once per batch and prints the publication, never the draft', async () => {
  jest.mocked(getBadgeLayout).mockResolvedValue({ success: true, state })
  await printProjectBadges('one', [badge, badge], popup)
  expect(getBadgeLayout).toHaveBeenCalledTimes(1)
  expect(renderLayoutPrintWindow).toHaveBeenCalledWith(
    popup,
    state.published,
    expect.arrayContaining([
      expect.objectContaining({ country: 'Taiwan', registrationCode: 'EX123' }),
    ])
  )
  expect(jest.mocked(renderLayoutPrintWindow).mock.calls[0][2]).toHaveLength(2)
  expect(printBadges).not.toHaveBeenCalled()
})
it('uses legacy when no publication exists, even when a draft exists', async () => {
  jest
    .mocked(getBadgeLayout)
    .mockResolvedValue({
      success: true,
      state: { ...state, published: null, publishedRevision: 0 },
    })
  await printProjectBadges('one', [badge], popup)
  expect(printBadges).toHaveBeenCalledWith([badge], 'THAILAB2026', popup)
})
it('falls back only with known project metadata on API failure', async () => {
  jest
    .mocked(getBadgeLayout)
    .mockResolvedValue({ success: false, error: 'Offline' })
  await printProjectBadges('one', [badge], popup)
  expect(printBadges).toHaveBeenCalledWith([badge], 'THAILAB2026', popup)
  await expect(printProjectBadges('unknown', [badge], popup)).rejects.toThrow(
    'verify project'
  )
})
it.each([401, 403])('stops on authorization error %s', async (status) => {
  jest
    .mocked(getBadgeLayout)
    .mockResolvedValue({ success: false, error: 'Denied', status })
  await expect(printProjectBadges('one', [badge], popup)).rejects.toThrow(
    'Denied'
  )
  expect(printBadges).not.toHaveBeenCalled()
  expect(popup.close).toHaveBeenCalled()
})
