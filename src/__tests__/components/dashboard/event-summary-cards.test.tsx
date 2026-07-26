import { render, screen } from '@testing-library/react'
import { EventSummaryCards } from '@/components/dashboard/event-summary-cards'

describe('EventSummaryCards', () => {
  it('renders active and inactive event totals', () => {
    render(
      <EventSummaryCards
        events={[
          {
            event_uuid: 'a',
            event_code: 'EVENT_A',
            event_name: 'Event A',
            is_active: true,
            total_participants: 1200,
            total_exhibitors: 90,
            total_conferences: 20,
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
  })

  it('renders an empty state', () => {
    render(<EventSummaryCards events={[]} />)

    expect(screen.getByText('No events available')).toBeInTheDocument()
  })
})
