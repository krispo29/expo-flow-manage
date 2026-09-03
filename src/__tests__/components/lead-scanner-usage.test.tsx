import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { LeadScannerUsage } from '@/components/lead-scanner-usage'
import * as actions from '@/app/actions/lead-scanner'

jest.mock('@/app/actions/lead-scanner', () => ({ getLeadScannerUsage: jest.fn(), exportLeadScannerUsage: jest.fn() }))
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 260 }}>{children}</div>
    ),
  }
})

const mockGetUsage = actions.getLeadScannerUsage as jest.MockedFunction<typeof actions.getLeadScannerUsage>
const mockExportUsage = actions.exportLeadScannerUsage as jest.MockedFunction<typeof actions.exportLeadScannerUsage>

const usage = {
  success: true as const,
  data: {
    startDate: '2026-09-02', endDate: '2026-09-04',
    overall: [
      { companyName: 'A Dose Pharma', totalScanned: 7, totalContact: 6 },
      { companyName: 'A&D Instruments', totalScanned: 26, totalContact: 23 },
    ],
  },
}

describe('LeadScannerUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUsage.mockResolvedValue(usage)
    mockExportUsage.mockResolvedValue({ success: true, bytes: [1, 2, 3], filename: 'usage.xlsx' })
    Object.defineProperty(URL, 'createObjectURL', { writable: true, value: jest.fn(() => 'blob:test') })
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: jest.fn() })
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  })

  afterEach(() => jest.restoreAllMocks())

  it('shows report range, totals, and rows ordered by scans', async () => {
    render(<LeadScannerUsage projectId="project-a" />)

    expect(await screen.findByText(/Sep 2, 2026.*Sep 4, 2026/i)).toBeInTheDocument()
    expect(screen.getByText('33')).toBeInTheDocument()
    expect(screen.getByText('29')).toBeInTheDocument()
    expect(screen.getByText('Peak Hour Traffic')).toBeInTheDocument()
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('A&D Instruments')
  })

  it('filters companies locally and downloads Excel', async () => {
    const user = userEvent.setup()
    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    await user.type(screen.getByPlaceholderText(/search companies/i), 'Dose')
    expect(screen.queryByText('A&D Instruments')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /export excel/i }))

    await waitFor(() => expect(mockExportUsage).toHaveBeenCalledWith('project-a'))
    expect(toast.success).toHaveBeenCalledWith('Lead Scanner usage exported')
  })

  it('shows a retryable initial load error', async () => {
    mockGetUsage.mockResolvedValue({ success: false, error: 'Unable to load report' })
    render(<LeadScannerUsage projectId="project-a" />)

    expect(await screen.findByText('Unable to load report')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows an export error', async () => {
    const user = userEvent.setup()
    mockExportUsage.mockResolvedValue({ success: false, error: 'Export failed' })
    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    await user.click(screen.getByRole('button', { name: /export excel/i }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Export failed'))
  })

  it('renders day tabs and updates totals and rows when switching days', async () => {
    const user = userEvent.setup()
    mockGetUsage.mockResolvedValue({
      success: true,
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-03',
        overall: [
          { companyName: 'A Dose Pharma', totalScanned: 7, totalContact: 6 },
          { companyName: 'A&D Instruments', totalScanned: 23, totalContact: 20 },
        ],
        days: [
          {
            dayLabel: '02 Sep 2026',
            overall: [
              { companyName: 'A Dose Pharma', totalScanned: 5, totalContact: 4 },
              { companyName: 'A&D Instruments', totalScanned: 13, totalContact: 10 },
            ],
          },
          {
            dayLabel: '03 Sep 2026',
            overall: [
              { companyName: 'A Dose Pharma', totalScanned: 2, totalContact: 2 },
              { companyName: 'A&D Instruments', totalScanned: 10, totalContact: 10 },
            ],
          },
        ],
      },
    })

    render(<LeadScannerUsage projectId="project-a" />)

    expect(await screen.findByRole('tab', { name: /Total/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '02 Sep 2026' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '03 Sep 2026' })).toBeInTheDocument()

    // Default is total (30 scanned: 7 + 23)
    expect(screen.getByText('30')).toBeInTheDocument()

    // Click 02 Sep 2026 tab (18 scanned: 5 + 13)
    await user.click(screen.getByRole('tab', { name: '02 Sep 2026' }))
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()

    // Click 03 Sep 2026 tab (12 scanned: 2 + 10, 12 contacts: 2 + 10)
    await user.click(screen.getByRole('tab', { name: '03 Sep 2026' }))
    expect(screen.getAllByText('12')).toHaveLength(2)
  })
})
