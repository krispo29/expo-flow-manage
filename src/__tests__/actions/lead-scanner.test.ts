import api from '@/lib/api'
import { exportLeadScannerUsage, getLeadScannerUsage } from '@/app/actions/lead-scanner'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn() },
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unexpected error',
}))
jest.mock('@/lib/authorization', () => ({ verifyProjectAccess: jest.fn() }))
jest.mock('@/lib/server-auth', () => ({ getServerAuthContext: jest.fn(), requireServerAuthHeaders: jest.fn() }))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockVerifyProjectAccess = verifyProjectAccess as jest.MockedFunction<typeof verifyProjectAccess>
const mockAuthContext = getServerAuthContext as jest.MockedFunction<typeof getServerAuthContext>
const mockAuthHeaders = requireServerAuthHeaders as jest.MockedFunction<typeof requireServerAuthHeaders>

describe('lead scanner actions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockAuthContext.mockResolvedValue({ accessToken: 'admin-token', userRole: 'ADMIN' })
    mockVerifyProjectAccess.mockResolvedValue(true)
    mockAuthHeaders.mockResolvedValue({ Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' })
  })

  it('loads usage through the Admin project endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: { data: {
      start_date: '2026-09-02', end_date: '2026-09-04',
      overall: [{ company_name: 'A Dose Pharma', total_scanned: 7, total_contact: 6 }],
    } } })

    await expect(getLeadScannerUsage('project-a')).resolves.toEqual({
      success: true,
      data: { startDate: '2026-09-02', endDate: '2026-09-04', overall: [{ companyName: 'A Dose Pharma', totalScanned: 7, totalContact: 6 }] },
    })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/admin/project/lead-scanner/usage', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
    })
  })

  it('maps hourly_traffic and peak_time when returned by API', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: {
          start_date: '2026-09-02',
          end_date: '2026-09-04',
          overall: [],
          peak_time: '2 PM',
          hourly_traffic: [
            { hour: '14:00', label: '2PM', total_scanned: 64 },
          ],
        },
      },
    })

    await expect(getLeadScannerUsage('project-a')).resolves.toEqual({
      success: true,
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-04',
        overall: [],
        peakTime: '2 PM',
        hourlyTraffic: [
          { hour: '14:00', label: '2PM', scans: 64 },
        ],
      },
    })
  })

  it('blocks missing or inaccessible Admin project scope', async () => {
    await expect(getLeadScannerUsage()).resolves.toEqual({ success: false, error: 'Select a project to view Lead Scanner usage' })
    mockVerifyProjectAccess.mockResolvedValue(false)
    await expect(getLeadScannerUsage('project-b')).resolves.toEqual({ success: false, error: 'Unauthorized: Access denied to project project-b' })
    expect(mockApiGet).not.toHaveBeenCalled()
  })

  it('exports usage bytes and the server filename', async () => {
    mockApiGet.mockResolvedValue({
      data: new Uint8Array([1, 2, 3]).buffer,
      headers: { 'content-disposition': 'attachment; filename="lead-scanner.xlsx"' },
    })

    await expect(exportLeadScannerUsage('project-a')).resolves.toEqual({ success: true, bytes: [1, 2, 3], filename: 'lead-scanner.xlsx' })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/admin/project/lead-scanner/export-excel-usage', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
      responseType: 'arraybuffer',
    })
  })
})
