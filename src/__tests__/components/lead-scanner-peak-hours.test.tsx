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
})
