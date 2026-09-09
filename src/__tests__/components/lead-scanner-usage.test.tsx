import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { LeadScannerUsage } from '@/components/lead-scanner-usage'
import * as actions from '@/app/actions/lead-scanner'

jest.mock('@/app/actions/lead-scanner', () => ({
  getLeadScannerUsage: jest.fn(),
  exportLeadScannerUsage: jest.fn(),
  disableAllLeadScanners: jest.fn(),
}))
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
const mockDisableAll = actions.disableAllLeadScanners as jest.MockedFunction<typeof actions.disableAllLeadScanners>

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
    mockDisableAll.mockResolvedValue({ success: true })
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
            chart: { peakHour: 10, peakScans: 13, data: [{ hour: 10, label: '10AM', scans: 13 }] },
            overall: [
              { companyName: 'A Dose Pharma', totalScanned: 5, totalContact: 4 },
              { companyName: 'A&D Instruments', totalScanned: 13, totalContact: 10 },
            ],
          },
          {
            dayLabel: '03 Sep 2026',
            chart: { peakHour: 14, peakScans: 10, data: [{ hour: 14, label: '2PM', scans: 10 }] },
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
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('10AM')

    // Click 03 Sep 2026 tab (12 scanned: 2 + 10, 12 contacts: 2 + 10)
    await user.click(screen.getByRole('tab', { name: '03 Sep 2026' }))
    expect(screen.getAllByText('12')).toHaveLength(2)
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('2PM')
  })

  it('allows sorting columns and clearing search', async () => {
    const user = userEvent.setup()
    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    // Initial order by scans desc: A&D Instruments (26), A Dose Pharma (7)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('A&D Instruments')

    // Click Scanned header to toggle to asc: A Dose Pharma (7) becomes 1st
    const scannedHeaderBtn = screen.getByRole('button', { name: /scanned/i })
    await user.click(scannedHeaderBtn)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('A Dose Pharma')

    // Click again to toggle back to desc: A&D Instruments (26) becomes 1st
    await user.click(scannedHeaderBtn)
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('A&D Instruments')

    // Type in search, then click clear search button
    const searchInput = screen.getByPlaceholderText(/search companies/i)
    await user.type(searchInput, 'Dose')
    expect(screen.queryByText('A&D Instruments')).not.toBeInTheDocument()

    const clearBtn = screen.getByTitle('Clear search')
    await user.click(clearBtn)
    expect(searchInput).toHaveValue('')
    expect(screen.getByText('A&D Instruments')).toBeInTheDocument()
  })

  it('paginates company rows and navigates pages', async () => {
    const user = userEvent.setup()
    const companies = Array.from({ length: 30 }, (_, i) => ({
      companyName: `Company ${String(i + 1).padStart(2, '0')}`,
      totalScanned: 100 - i,
      totalContact: 50 - i,
    }))

    mockGetUsage.mockResolvedValue({
      success: true,
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-04',
        overall: companies,
      },
    })

    render(<LeadScannerUsage projectId="project-a" />)
    expect(await screen.findByText('Company 01')).toBeInTheDocument()

    // Default pageSize is 25: shows 1 to 25 of 30 companies
    expect(screen.getByTestId('pagination-showing')).toHaveTextContent('Showing 1 to 25 of 30 companies')
    expect(screen.getByText('Company 25')).toBeInTheDocument()
    expect(screen.queryByText('Company 26')).not.toBeInTheDocument()

    // Click Next page button
    const nextBtn = screen.getByTitle('Next page')
    await user.click(nextBtn)

    expect(screen.getByTestId('pagination-showing')).toHaveTextContent('Showing 26 to 30 of 30 companies')
    expect(screen.getByText('Company 26')).toBeInTheDocument()
    expect(screen.queryByText('Company 01')).not.toBeInTheDocument()

    // Change per page to 10
    const perPageSelect = screen.getByLabelText(/items per page/i)
    await user.selectOptions(perPageSelect, '10')

    expect(screen.getByTestId('pagination-showing')).toHaveTextContent('Showing 1 to 10 of 30 companies')
    expect(screen.getByText('Company 10')).toBeInTheDocument()
    expect(screen.queryByText('Company 11')).not.toBeInTheDocument()
  })

  it('renders new metrics and table columns with downloaded status badges', async () => {
    mockGetUsage.mockResolvedValue({
      success: true,
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-04',
        totalScanned: 8846,
        totalContact: 8506,
        totalExportedContact: 1533,
        totalDownloadCount: 13,
        totalLeadScannerEnabledCount: 262,
        overall: [
          {
            companyName: 'A Dose Pharma',
            totalScanned: 17,
            totalContact: 16,
            totalExportedContact: 10,
            totalDownloadCount: 2,
            isDownloaded: true,
          },
          {
            companyName: 'B Health Care',
            totalScanned: 5,
            totalContact: 4,
            totalExportedContact: 0,
            totalDownloadCount: 0,
            isDownloaded: false,
          },
        ],
      },
    })

    render(<LeadScannerUsage projectId="project-a" />)

    expect(await screen.findByText('262')).toBeInTheDocument()
    expect(screen.getByText('8,846')).toBeInTheDocument()
    expect(screen.getByText('8,506')).toBeInTheDocument()
    expect(screen.getByText('1,533')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()

    // Check table headers and filter buttons
    expect(screen.getByRole('button', { name: /exported/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /downloads/i })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /downloaded/i })).toHaveLength(2)

    // Check badges
    expect(screen.getByText('Downloaded', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
    expect(screen.getByText('Not downloaded', { selector: '[data-slot="badge"]' })).toBeInTheDocument()
  })

  it('filters table rows via quick status filter pills', async () => {
    const user = userEvent.setup()
    mockGetUsage.mockResolvedValue({
      success: true,
      data: {
        startDate: '2026-09-02',
        endDate: '2026-09-04',
        overall: [
          { companyName: 'Company Alpha', totalScanned: 10, totalContact: 8, isDownloaded: true },
          { companyName: 'Company Beta', totalScanned: 5, totalContact: 4, isDownloaded: false },
          { companyName: 'Company Gamma', totalScanned: 0, totalContact: 0, isDownloaded: false },
        ],
      },
    })

    render(<LeadScannerUsage projectId="project-a" />)
    expect(await screen.findByText('Company Alpha')).toBeInTheDocument()
    expect(screen.getByText('Company Beta')).toBeInTheDocument()
    expect(screen.getByText('Company Gamma')).toBeInTheDocument()

    // Filter by Downloaded
    const downloadedPill = screen.getAllByRole('button', { name: /downloaded/i })[0]
    await user.click(downloadedPill)
    expect(screen.getByText('Company Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Company Beta')).not.toBeInTheDocument()
    expect(screen.queryByText('Company Gamma')).not.toBeInTheDocument()

    // Filter by Pending Download
    const pendingPill = screen.getByRole('button', { name: /pending download/i })
    await user.click(pendingPill)
    expect(screen.queryByText('Company Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Company Beta')).toBeInTheDocument()
    expect(screen.getByText('Company Gamma')).toBeInTheDocument()

    // Filter by No Scans
    const noScansPill = screen.getByRole('button', { name: /no scans/i })
    await user.click(noScansPill)
    expect(screen.queryByText('Company Alpha')).not.toBeInTheDocument()
    expect(screen.queryByText('Company Beta')).not.toBeInTheDocument()
    expect(screen.getByText('Company Gamma')).toBeInTheDocument()

    // Reset filter
    const resetBtn = screen.getByRole('button', { name: /reset filter/i })
    await user.click(resetBtn)
    expect(screen.getByText('Company Alpha')).toBeInTheDocument()
    expect(screen.getByText('Company Beta')).toBeInTheDocument()
    expect(screen.getByText('Company Gamma')).toBeInTheDocument()
  })

  it('copies company name to clipboard on button click', async () => {
    const user = userEvent.setup()
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
    })

    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    const copyBtn = screen.getByRole('button', { name: /copy a&d instruments/i })
    await user.click(copyBtn)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('A&D Instruments')
    expect(toast.success).toHaveBeenCalledWith('Copied "A&D Instruments"')
  })

  it('opens confirmation modal and disables all lead scanners', async () => {
    const user = userEvent.setup()
    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    // Click Disable All button in header
    const disableAllBtn = screen.getByRole('button', { name: /disable all/i })
    await user.click(disableAllBtn)

    // Confirm dialog appears
    expect(screen.getByRole('heading', { name: /disable all lead scanners/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Are you sure you want to disable Lead Scanner for all exhibitors in this project/i),
    ).toBeInTheDocument()

    // Click Confirm button inside modal
    const confirmBtn = screen.getByRole('button', { name: /disable all scanners/i })
    await user.click(confirmBtn)

    await waitFor(() => expect(mockDisableAll).toHaveBeenCalledWith('project-a'))
    expect(toast.success).toHaveBeenCalledWith('Disabled all Lead Scanners successfully')
    expect(mockGetUsage).toHaveBeenCalledTimes(2) // Initial load + refresh after disable
  })

  it('shows error toast when disabling all lead scanners fails', async () => {
    const user = userEvent.setup()
    mockDisableAll.mockResolvedValue({ success: false, error: 'Permission denied' })
    render(<LeadScannerUsage projectId="project-a" />)
    await screen.findByText('A&D Instruments')

    await user.click(screen.getByRole('button', { name: /disable all/i }))
    await user.click(screen.getByRole('button', { name: /disable all scanners/i }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Permission denied'))
  })

  it('renders smart day navigator and handles day stepping and total reset', async () => {
    const user = userEvent.setup()
    mockGetUsage.mockResolvedValue({
      success: true,
      data: {
        startDate: '2026-09-04',
        endDate: '2026-09-21',
        totalScanned: 100,
        totalContact: 80,
        totalExportedContact: 50,
        totalDownloadCount: 5,
        totalLeadScannerEnabledCount: 12,
        overall: [{ companyName: 'Company 1', totalScanned: 10, totalContact: 8 }],
        days: Array.from({ length: 18 }, (_, i) => ({
          dayLabel: `Day ${i + 1} (2026-09-${String(i + 4).padStart(2, '0')})`,
          totalScanned: i + 1,
          totalContact: i + 1,
          overall: [{ companyName: 'Company 1', totalScanned: i + 1, totalContact: i + 1 }],
        })),
      },
    })

    render(<LeadScannerUsage projectId="project-a" />)

    // For 18 days (> 4), Smart Day Navigator renders
    const totalBtn = await screen.findByRole('button', { name: /Total \(All 18 Days\)/i })
    expect(totalBtn).toBeInTheDocument()

    const prevBtn = screen.getByRole('button', { name: /previous day/i })
    const nextBtn = screen.getByRole('button', { name: /next day/i })
    expect(prevBtn).toBeInTheDocument()
    expect(nextBtn).toBeInTheDocument()
    expect(prevBtn).toBeDisabled() // disabled when on total

    // Click Next day button: advances to Day 1
    await user.click(nextBtn)
    expect(screen.getByText('Day 1 of 18')).toBeInTheDocument()

    // Now prevBtn is disabled (since on Day 1), and nextBtn is enabled
    expect(prevBtn).toBeDisabled()
    expect(nextBtn).toBeEnabled()

    // Click Next day button again: advances to Day 2
    await user.click(nextBtn)
    expect(screen.getByText('Day 2 of 18')).toBeInTheDocument()
    expect(prevBtn).toBeEnabled()

    // Click Previous day button: goes back to Day 1
    await user.click(prevBtn)
    expect(screen.getByText('Day 1 of 18')).toBeInTheDocument()

    // Click Total button: resets to Total
    await user.click(totalBtn)
    expect(screen.queryByText('Day 1 of 18')).not.toBeInTheDocument()
  })
})
