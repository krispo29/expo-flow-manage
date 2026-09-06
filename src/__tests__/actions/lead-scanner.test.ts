import api from '@/lib/api'
import {
  disableAllLeadScanners,
  exportLeadScannerUsage,
  getLeadScannerUsage,
} from '@/app/actions/lead-scanner'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), patch: jest.fn() },
  getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Unexpected error',
}))
jest.mock('@/lib/authorization', () => ({ verifyProjectAccess: jest.fn() }))
jest.mock('@/lib/server-auth', () => ({ getServerAuthContext: jest.fn(), requireServerAuthHeaders: jest.fn() }))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockApiPatch = api.patch as jest.MockedFunction<typeof api.patch>
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
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-04',
        overall: [{
          companyName: 'A Dose Pharma',
          totalScanned: 7,
          totalContact: 6,
          totalExportedContact: 0,
          totalDownloadCount: 0,
          isDownloaded: false,
        }],
      },
    })
    expect(mockApiGet).toHaveBeenCalledWith('/v1/admin/project/lead-scanner/usage', {
      headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' },
    })
  })

  it('maps new metrics at root, day, and item levels', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        code: 200,
        data: {
          start_date: '2026-09-02',
          end_date: '2026-09-04',
          total_scanned: 8846,
          total_contact: 8506,
          total_exported_contact: 1533,
          total_download_count: 13,
          total_lead_scanner_enabled_count: 262,
          days: [
            {
              day: 0,
              day_label: 'Overall',
              date: '',
              total_scanned: 8846,
              total_contact: 8506,
              total_exported_contact: 1533,
              total_download_count: 13,
              items: [
                {
                  company_name: 'A Dose Pharma Co., Ltd.',
                  total_scanned: 17,
                  total_contact: 16,
                  total_exported_contact: 5,
                  download_count: 2,
                  is_downloaded: true,
                },
              ],
            },
          ],
        },
      },
    })

    const result = await getLeadScannerUsage('project-a')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.totalScanned).toBe(8846)
      expect(result.data.totalContact).toBe(8506)
      expect(result.data.totalExportedContact).toBe(1533)
      expect(result.data.totalDownloadCount).toBe(13)
      expect(result.data.totalLeadScannerEnabledCount).toBe(262)
      expect(result.data.days).toHaveLength(1)
      expect(result.data.days?.[0].totalExportedContact).toBe(1533)
      expect(result.data.days?.[0].totalDownloadCount).toBe(13)
      expect(result.data.overall).toEqual([
        {
          companyName: 'A Dose Pharma Co., Ltd.',
          totalScanned: 17,
          totalContact: 16,
          totalExportedContact: 5,
          totalDownloadCount: 2,
          isDownloaded: true,
        },
      ])
    }
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
                { company_name: 'A Dose Pharma', total_scanned: 5, total_contact: 4, total_exported_contact: 2, total_download_count: 1, is_downloaded: true },
                { company_name: 'A&D Instruments', total_scanned: 13, total_contact: 10, total_exported_contact: 4, total_download_count: 2, is_downloaded: false },
              ],
            },
            {
              day_label: '03 Sep 2026',
              companies: [
                { company_name: 'A Dose Pharma', total_scanned: 2, total_contact: 2, total_exported_contact: 1, total_download_count: 1, is_downloaded: true },
                { company_name: 'A&D Instruments', total_scanned: 10, total_contact: 10, total_exported_contact: 3, total_download_count: 1, is_downloaded: true },
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
        { companyName: 'A Dose Pharma', totalScanned: 7, totalContact: 6, totalExportedContact: 3, totalDownloadCount: 2, isDownloaded: true },
        { companyName: 'A&D Instruments', totalScanned: 23, totalContact: 20, totalExportedContact: 7, totalDownloadCount: 3, isDownloaded: true },
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

  it('disables all lead scanners through PATCH endpoint', async () => {
    mockApiPatch.mockResolvedValue({ data: { success: true } })

    const result = await disableAllLeadScanners('project-a')
    expect(result).toEqual({ success: true })
    expect(mockApiPatch).toHaveBeenCalledWith(
      '/v1/admin/project/lead-scanner/disable-all',
      {},
      { headers: { Authorization: 'Bearer token', 'X-Project-UUID': 'project-a' } },
    )
  })

  it('returns error when disableAllLeadScanners fails', async () => {
    mockApiPatch.mockRejectedValue(new Error('Failed to disable'))

    const result = await disableAllLeadScanners('project-a')
    expect(result).toEqual({ success: false, error: 'Failed to disable' })
  })
})
