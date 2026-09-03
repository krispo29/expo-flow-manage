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

  it('parses days array and auto-aggregates overall when overall is missing', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: {
          start_date: '2026-09-02',
          end_date: '2026-09-03',
          days: [
            {
              day_label: '02 Sep 2026',
              companies: [
                { company_name: 'A Dose Pharma', total_scanned: 5, total_contact: 4 },
                { company_name: 'A&D Instruments', total_scanned: 13, total_contact: 10 },
              ],
            },
            {
              day_label: '03 Sep 2026',
              companies: [
                { company_name: 'A Dose Pharma', total_scanned: 2, total_contact: 2 },
                { company_name: 'A&D Instruments', total_scanned: 10, total_contact: 10 },
              ],
            },
          ],
        },
      },
    })

    const result = await getLeadScannerUsage('project-a')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.days).toHaveLength(2)
      expect(result.data.days?.[0].dayLabel).toBe('02 Sep 2026')
      expect(result.data.days?.[1].dayLabel).toBe('03 Sep 2026')
      // Aggregated overall
      expect(result.data.overall).toEqual([
        { companyName: 'A Dose Pharma', totalScanned: 7, totalContact: 6 },
        { companyName: 'A&D Instruments', totalScanned: 23, totalContact: 20 },
      ])
    }
  })

  it('parses flat days array with day_label and groups by day', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: {
          start_date: '2026-09-02',
          end_date: '2026-09-03',
          days: [
            { day_label: '02 Sep 2026', company_name: 'A Dose Pharma', total_scanned: 5, total_contact: 4 },
            { day_label: '03 Sep 2026', company_name: 'A Dose Pharma', total_scanned: 2, total_contact: 2 },
          ],
        },
      },
    })

    const result = await getLeadScannerUsage('project-a')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.days).toHaveLength(2)
      expect(result.data.days?.[0].dayLabel).toBe('02 Sep 2026')
      expect(result.data.days?.[0].overall[0].totalScanned).toBe(5)
      expect(result.data.days?.[1].dayLabel).toBe('03 Sep 2026')
      expect(result.data.days?.[1].overall[0].totalScanned).toBe(2)
    }
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
