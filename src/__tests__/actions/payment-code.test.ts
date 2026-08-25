import api, { getErrorMessage } from '@/lib/api'
import { exportPaymentCodes, getPaymentCodes } from '@/app/actions/payment-code'
import { requireServerAuthHeaders } from '@/lib/server-auth'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  getErrorMessage: jest.fn(),
}))

jest.mock('@/lib/server-auth', () => ({
  requireServerAuthHeaders: jest.fn(),
}))

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>
const mockGetErrorMessage = getErrorMessage as jest.MockedFunction<typeof getErrorMessage>
const mockRequireServerAuthHeaders = requireServerAuthHeaders as jest.MockedFunction<typeof requireServerAuthHeaders>

describe('payment code actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockApiGet.mockReset()
    mockRequireServerAuthHeaders.mockResolvedValue({
      Authorization: 'Bearer token-123',
      'X-Project-UUID': 'project-456',
    })
  })

  it('lists payment codes with the active project headers and filters', async () => {
    const data = {
      summary: { total: 3, unused: 2, used: 1 },
      items: [],
      page: 2,
      page_size: 25,
      total: 1,
    }
    mockApiGet.mockResolvedValue({ data: { data } })

    const result = await getPaymentCodes('project-456', {
      status: 'used',
      search: 'REG-001',
      page: 2,
      pageSize: 25,
    })

    expect(result).toEqual({ success: true, data })
    expect(mockRequireServerAuthHeaders).toHaveBeenCalledWith({ projectUuid: 'project-456' })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/payment-codes',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer token-123',
          'X-Project-UUID': 'project-456',
        },
        params: { status: 'used', search: 'REG-001', page: 2, page_size: 25 },
      })
    )
  })

  it('returns stable empty data when listing payment codes fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'))
    mockGetErrorMessage.mockReturnValue('Network error')

    const result = await getPaymentCodes('project-456', { page: 2, pageSize: 25 })

    expect(result).toEqual({
      success: false,
      error: 'Network error',
      data: {
        summary: { total: 0, unused: 0, used: 0 },
        items: [],
        page: 2,
        page_size: 25,
        total: 0,
      },
    })
  })

  it('exports filtered payment codes as bytes without pagination', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    mockApiGet.mockResolvedValue({
      data: bytes.buffer,
      headers: { 'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    })

    const result = await exportPaymentCodes('project-456', { status: 'unused', search: 'PAY-001' })

    expect(result).toEqual({
      success: true,
      data: new Uint8Array(bytes.buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(mockApiGet).toHaveBeenCalledWith(
      '/v1/admin/project/payment-codes/export',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer token-123',
          'X-Project-UUID': 'project-456',
        },
        params: { status: 'unused', search: 'PAY-001' },
        responseType: 'arraybuffer',
      })
    )
  })

  it('returns the API error message when exporting payment codes fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Export failed'))
    mockGetErrorMessage.mockReturnValue('Export failed')

    await expect(exportPaymentCodes('project-456', {})).resolves.toEqual({
      success: false,
      error: 'Export failed',
    })
  })
})
