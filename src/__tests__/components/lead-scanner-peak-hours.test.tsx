import React from 'react'
import { render, screen } from '@testing-library/react'
import { LeadScannerPeakHours } from '@/components/lead-scanner-peak-hours'

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 260 }}>{children}</div>
    ),
  }
})

describe('LeadScannerPeakHours', () => {
  it('renders card title, legend, and computes peak time from data', () => {
    const mockData = [
      { hour: '10:00', label: '10AM', scans: 12 },
      { hour: '13:00', label: '1PM', scans: 25 },
      { hour: '14:00', label: '2PM', scans: 64 },
      { hour: '16:00', label: '4PM', scans: 40 },
    ]

    render(<LeadScannerPeakHours data={mockData} />)

    expect(screen.getByText('Peak Hour Traffic')).toBeInTheDocument()
    expect(screen.getByText('Scans')).toBeInTheDocument()
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('2PM')
    expect(screen.getByText('Peak Time')).toBeInTheDocument()
    expect(screen.getByTestId('peak-hours-chart-container')).toBeInTheDocument()
  })

  it('uses explicit peakTime prop when provided', () => {
    const mockData = [
      { hour: '10:00', label: '10AM', scans: 12 },
      { hour: '14:00', label: '2PM', scans: 64 },
    ]

    render(<LeadScannerPeakHours data={mockData} peakTime="2:00 PM" />)

    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('2:00 PM')
  })

  it('renders zero-value fallback data when a chart is unavailable', () => {
    render(<LeadScannerPeakHours />)

    expect(screen.getByText('Peak Hour Traffic')).toBeInTheDocument()
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('-')
  })

  it('uses the backend peak hour label', () => {
    render(
      <LeadScannerPeakHours
        chart={{ peakHour: 13, peakScans: 9, data: [{ hour: 13, label: '1PM', scans: 9 }] }}
      />,
    )

    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('1PM')
  })

  it('displays dash for peak time when totalScanned is 0 and no data', () => {
    render(<LeadScannerPeakHours />)

    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('-')
  })

  it('parses multi-day date strings into clean hierarchical peak time and shows day tabs', () => {
    const multiDayData = [
      { date: '2026-09-02', hour: '13:00', label: '2026-09-02 1PM', scans: 25 },
      { date: '2026-09-02', hour: '14:00', label: '2026-09-02 2PM', scans: 40 },
      { date: '2026-09-03', hour: '15:00', label: '2026-09-03 3PM', scans: 80 },
      { date: '2026-09-04', hour: '11:00', label: '2026-09-04 11AM', scans: 15 },
    ]

    render(<LeadScannerPeakHours data={multiDayData} />)

    // Hero peak time should show the clean time part
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('3PM')
    // Subtitle should show the formatted date
    expect(screen.getByText(/Thu, 3 Sep 2026/)).toBeInTheDocument()

    // Day tabs should be rendered
    expect(screen.getByRole('button', { name: /All Days/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Day 1/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Day 2/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Day 3/ })).toBeInTheDocument()
  })

  it('filters data and updates peak time when a specific day tab is clicked', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const multiDayData = [
      { date: '2026-09-02', hour: '13:00', label: '2026-09-02 1PM', scans: 50 },
      { date: '2026-09-02', hour: '14:00', label: '2026-09-02 2PM', scans: 20 },
      { date: '2026-09-03', hour: '15:00', label: '2026-09-03 3PM', scans: 80 },
    ]

    render(<LeadScannerPeakHours data={multiDayData} />)

    // Initially overall peak is 3PM (80 scans)
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('3PM')

    // Click Day 1 (Sep 2)
    const day1Btn = screen.getByRole('button', { name: /Day 1/ })
    fireEvent.click(day1Btn)

    // Now peak should be Day 1's peak: 1PM (50 scans)
    expect(screen.getByTestId('peak-time-value')).toHaveTextContent('1PM')
    expect(screen.getByText(/Wed, 2 Sep 2026/)).toBeInTheDocument()
  })
})
