import { render, screen } from '@testing-library/react'
import { BusinessMatchingSummary } from '@/components/business-matching/business-matching-summary'

jest.mock('@/app/actions/business-matching-report', () => ({
  getBusinessMatchingReport: jest.fn(),
  getBusinessMatchingDetails: jest.fn(() => new Promise(() => {})),
  exportBusinessMatchingCsv: jest.fn(),
}))

describe('BusinessMatchingSummary', () => {
  it('renders read-only code metrics for an organizer', () => {
    render(
      <BusinessMatchingSummary
        role="ORGANIZER"
        result={{
          success: true,
          projectUuid: 'project-a',
          eventUuid: 'event-a',
          events: [],
          summary: {
            project_uuid: 'project-a',
            event_uuid: 'event-a',
            generated_at: '2026-08-13T00:00:00Z',
            totals: { requested: 8, redemption_stamps_issued: 5, redemption_stamps_redeemed: 2 },
          },
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Business Matching' })).toBeInTheDocument()
    expect(screen.getByText('Codes issued')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText(/redeem code/i)).not.toBeInTheDocument()
  })

  it('renders the action error without rendering report totals', () => {
    render(
      <BusinessMatchingSummary
        role="ADMIN"
        result={{ success: false, error: 'Select a project to view the Business Matching report', events: [] }}
      />,
    )

    expect(screen.getByText('Select a project to view the Business Matching report')).toBeInTheDocument()
    expect(screen.queryByText('Codes issued')).not.toBeInTheDocument()
  })

  it('does not render a scanner, lookup, or redeem control', () => {
    render(
      <BusinessMatchingSummary
        role="ADMIN"
        result={{
          success: true,
          projectUuid: 'project-a',
          eventUuid: 'event-a',
          events: [],
          summary: {
            project_uuid: 'project-a',
            event_uuid: 'event-a',
            generated_at: '2026-08-13T00:00:00Z',
            totals: {},
          },
        }}
      />,
    )

    expect(screen.queryByRole('button', { name: /scan|lookup|redeem/i })).not.toBeInTheDocument()
  })
})
