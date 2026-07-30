import { render, screen } from '@testing-library/react'
import { EventSummaryCards } from '@/components/dashboard/event-summary-cards'

describe('EventSummaryCards', () => {
  it('renders active and inactive event totals', () => {
    render(
      <EventSummaryCards
        failed={false}
        events={[
          {
            event_uuid: 'a',
            event_code: 'EVENT_A',
            event_name: 'Event A',
            is_active: true,
            total_participants: 1200,
            total_exhibitors: 90,
            total_conferences: 20,
            daily_attendance: [
              { date: '2026-09-02', local: 1234, oversea: 56 },
              { date: '2026-09-03', local: 789, oversea: 10 },
            ],
          },
          {
            event_uuid: 'b',
            event_code: 'EVENT_B',
            event_name: 'Event B',
            is_active: false,
            total_participants: 0,
            total_exhibitors: 0,
            total_conferences: 0,
          },
        ]}
      />
    )

    expect(screen.getByText('Event Overview')).toBeInTheDocument()
    expect(screen.getByText('Event A')).toBeInTheDocument()
    expect(screen.getByText('Event B')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
    expect(screen.getByText('1,200')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(3)
    expect(screen.getAllByText('Date')).toHaveLength(2)
    expect(screen.getAllByText('Local')).toHaveLength(2)
    expect(screen.getAllByText('Oversea')).toHaveLength(2)
    expect(screen.getByText('2026-09-02')).toBeInTheDocument()
    expect(screen.getByText('2026-09-03')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('56')).toBeInTheDocument()
    expect(screen.getByText('789')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('No attendance data')).toBeInTheDocument()
  })

  it('renders an empty state', () => {
    render(<EventSummaryCards events={[]} failed={false} />)

    expect(screen.getByText('No events available')).toBeInTheDocument()
  })

  it('renders an unavailable state when the dashboard fails', () => {
    render(<EventSummaryCards events={[]} failed />)

    expect(screen.getByText('Event summaries unavailable')).toBeInTheDocument()
    expect(screen.queryByText('No events available')).not.toBeInTheDocument()
  })
})
