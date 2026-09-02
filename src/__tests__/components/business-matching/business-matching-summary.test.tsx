import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BusinessMatchingSummary } from '@/components/business-matching/business-matching-summary'
import * as actions from '@/app/actions/business-matching-report'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/app/actions/business-matching-report', () => ({
  getBusinessMatchingReport: jest.fn(),
  getBusinessMatchingDetails: jest.fn(),
  exportBusinessMatchingCsv: jest.fn(),
}))

const mockGetBusinessMatchingDetails = actions.getBusinessMatchingDetails as jest.MockedFunction<
  typeof actions.getBusinessMatchingDetails
>

describe('BusinessMatchingSummary', () => {
  const mockResult = {
    success: true as const,
    projectUuid: 'project-a',
    eventUuid: 'event-a',
    events: [{ event_uuid: 'event-a', event_name: 'Expo A' }],
    summary: {
      project_uuid: 'project-a',
      event_uuid: 'event-a',
      generated_at: '2026-08-13T00:00:00Z',
      totals: {
        requested: 8,
        accepted: 4,
        rejected: 2,
        cancelled: 1,
        expired: 0,
        closed: 0,
        success: 3,
        redemption_stamps_issued: 5,
        redemption_stamps_redeemed: 2,
        surveys_submitted: 6,
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetBusinessMatchingDetails.mockResolvedValue({
      success: true,
      items: [
        {
          match_request_uuid: 'req-1',
          registration_code: 'VI-001',
          visitor_first_name: 'Alice',
          visitor_last_name: 'Smith',
          visitor_company_name: 'Alice Corp',
          exhibitor_company_name: 'Bob Exhibitor',
          booth_no: 'A1',
          status: 'Requested',
          report_status: 'Requested',
        },
      ],
      total: 1,
    })
  })

  it('renders all 9 live status metric cards and event report header', async () => {
    render(<BusinessMatchingSummary role="ORGANIZER" result={mockResult} />)

    expect(screen.getByRole('heading', { name: /Business matching event report/i })).toBeInTheDocument()
    expect(screen.getByText('Event performance overview')).toBeInTheDocument()
    expect(screen.getByText('9 live metrics')).toBeInTheDocument()

    // 9 metric cards
    expect(screen.getByRole('button', { name: /View Requested details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Accepted details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Rejected details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Cancelled details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Expired\/closed details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Success details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Stamps issued details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Stamps redeemed details/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View Surveys details/i })).toBeInTheDocument()

    // Metrics values
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getAllByText('5').length).toBeGreaterThan(0)
    expect(screen.getByText('3')).toBeInTheDocument()

    // Search and attention
    expect(screen.getByText('Find a request')).toBeInTheDocument()
    expect(screen.getByText('Needs attention')).toBeInTheDocument()

    // Charts
    expect(screen.getByText('Meeting Status Distribution')).toBeInTheDocument()
    expect(screen.getByText('Stamp Redemption Performance')).toBeInTheDocument()
  })

  it('opens detail modal when clicking a status metric card', async () => {
    const user = userEvent.setup()
    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    await user.click(screen.getByRole('button', { name: /View Requested details/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Requested' })).toBeInTheDocument()
    expect(screen.getByText('VI-001 - Alice Smith - Alice Corp')).toBeInTheDocument()
    expect(screen.getByText('Bob Exhibitor · Booth A1')).toBeInTheDocument()
  })

  it('identifies both exhibitor companies for an E2E request', async () => {
    const user = userEvent.setup()
    mockGetBusinessMatchingDetails.mockResolvedValue({
      success: true,
      items: [{
        match_request_uuid: 'req-e2e-1',
        requester_type: 'exhibitor',
        recipient_exhibitor_uuid: 'exhibitor-recipient',
        exhibitor_company_name: 'AA Company',
        recipient_exhibitor_name: 'BB Company',
        booth_no: 'A1',
        recipient_exhibitor_booth: 'B2',
        status: 'Requested',
      }],
      total: 1,
    })

    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    await user.click(screen.getByRole('button', { name: /View Requested details/i }))

    expect(await screen.findByText((_, element) => element?.textContent === 'Requester: AA Company · Booth A1')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.textContent === 'Recipient: BB Company · Booth B2')).toBeInTheDocument()
    expect(screen.queryByText('Visitor details unavailable')).not.toBeInTheDocument()
  })

  it('identifies E2E requests in needs attention without showing their UUID', async () => {
    const requestUUID = 'aeeac720-343f-492a-9053-53d468176ca5'
    mockGetBusinessMatchingDetails.mockResolvedValue({
      success: true,
      items: [{
        match_request_uuid: requestUUID,
        requester_type: 'exhibitor',
        recipient_exhibitor_uuid: 'exhibitor-recipient',
        exhibitor_company_name: 'AA Company',
        recipient_exhibitor_name: 'BB Company',
        status: 'Requested',
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      }],
      total: 1,
    })

    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    expect(await screen.findByText('Requester: AA Company → Recipient: BB Company')).toBeInTheDocument()
    expect(screen.queryByText(requestUUID)).not.toBeInTheDocument()
  })

  it('opens detail modal when clicking chart status shortcuts', async () => {
    const user = userEvent.setup()
    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    const confirmedMeetingsBtn = screen.getByRole('button', { name: /Confirmed meetings/i })
    await user.click(confirmedMeetingsBtn)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accepted' })).toBeInTheDocument()
  })

  it('searches and selects requests via keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    const searchInput = screen.getByPlaceholderText(/e.g. VI170067439/i)
    await user.type(searchInput, 'Alice')

    await waitFor(() => {
      expect(mockGetBusinessMatchingDetails).toHaveBeenCalledWith(
        expect.objectContaining({ q: 'Alice', type: 'match-requests' }),
      )
    })

    const suggestion = await screen.findByText('VI-001 - Alice Smith - Alice Corp')
    expect(suggestion).toBeInTheDocument()

    await user.keyboard('{ArrowDown}{Enter}')
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('VI-001 - Alice Smith - Alice Corp')).toBeInTheDocument()
  })

  it('renders the action error without rendering report totals', () => {
    render(
      <BusinessMatchingSummary
        role="ADMIN"
        result={{ success: false, error: 'Select a project to view the Business Matching report', events: [] }}
      />,
    )

    expect(screen.getByText('Select a project to view the Business Matching report')).toBeInTheDocument()
    expect(screen.queryByText('Event performance overview')).not.toBeInTheDocument()
  })

  it('does not render scanner, lookup, or redeem action buttons', () => {
    render(<BusinessMatchingSummary role="ADMIN" result={mockResult} />)

    expect(screen.queryByRole('button', { name: /^scan$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^redeem code$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^lookup stamp$/i })).not.toBeInTheDocument()
  })
})
