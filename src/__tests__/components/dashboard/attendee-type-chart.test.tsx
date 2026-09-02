import React from 'react'
import { render, screen } from '@testing-library/react'
import { AttendeeTypeChart } from '@/components/dashboard/attendee-type-chart'

// Mock Recharts ResponsiveContainer to render children with explicit dimensions in JSDOM
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 400, height: 210 }}>{children}</div>
    ),
  }
})

describe('AttendeeTypeChart', () => {
  it('returns null when data is empty', () => {
    const { container } = render(<AttendeeTypeChart data={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders total participants count and all legend items even with many categories', () => {
    const mockData = [
      { name: 'Buyer', count: 120 },
      { name: 'Exhibitor Staff', count: 80 },
      { name: 'Press', count: 20 },
      { name: 'Speaker', count: 15 },
      { name: 'VIP', count: 30 },
      { name: 'Visitor Group', count: 50 },
      { name: 'Visitor Group Onsite', count: 40 },
      { name: 'Visitor Onsite', count: 60 },
      { name: 'Visitor Pre-Registration', count: 200 },
    ]

    render(<AttendeeTypeChart data={mockData} />)

    // Total should be 615
    expect(screen.getByText('615')).toBeInTheDocument()
    expect(screen.getByText('Total')).toBeInTheDocument()

    // All legend labels should be rendered
    expect(screen.getByText('Buyer')).toBeInTheDocument()
    expect(screen.getByText('Visitor Pre-Registration')).toBeInTheDocument()
  })
})
