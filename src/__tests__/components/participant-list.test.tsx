import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ParticipantList } from '@/components/participant-list'
import { printParticipantBadge, getParticipantById } from '@/app/actions/participant'
import { printBadge } from '@/utils/print-badge'

jest.mock('@/app/actions/participant', () => ({
  createParticipant: jest.fn(),
  updateParticipant: jest.fn(),
  deleteParticipant: jest.fn(),
  getParticipantById: jest.fn(),
  resendEmailConfirmation: jest.fn(),
  getMyReservations: jest.fn(),
  reserveConference: jest.fn(),
  cancelConferenceReservation: jest.fn(),
  printParticipantBadge: jest.fn(),
  remindEmailConfirmation: jest.fn(),
  sendIndividualBusinessMatchingVisitor: jest.fn(),
}))

jest.mock('@/app/actions/conference', () => ({
  getConferences: jest.fn(),
  getRooms: jest.fn(),
}))

jest.mock('@/components/CountrySelector', () => ({
  CountrySelector: () => null,
}))

jest.mock('@/utils/print-badge', () => ({
  printBadge: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    promise: (promise: Promise<any>, { success, error }: any) => {
      return promise.then(
        (data) => (typeof success === 'function' ? success(data) : success),
        (err) => (typeof error === 'function' ? error(err) : error)
      )
    },
  },
}))

const participant = (registration_code: string, first_name: string) => ({
  registration_uuid: `uuid-${registration_code}`,
  registration_code,
  first_name,
  last_name: 'Example',
  email: `${first_name.toLowerCase()}@example.com`,
  company_name: 'Example Co',
  job_position: 'Manager',
  attendee_type_code: 'VI',
  registered_at: '2026-08-25T00:00:00Z',
  is_active: true,
  conference_count: 0,
  is_email_sent: false,
})

describe('ParticipantList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes the registration-code filter from a payment-code link', () => {
    render(
      <ParticipantList
        participants={[participant('REG-001', 'Alice'), participant('REG-002', 'Bob')]}
        projectId="project-1"
        attendeeTypes={[]}
        events={[]}
        initialRegistrationCode="REG-001"
      />,
    )

    expect(screen.getAllByDisplayValue('REG-001')).not.toHaveLength(0)
    expect(screen.getAllByText('Alice Example')).not.toHaveLength(0)
    expect(screen.queryByText('Bob Example')).not.toBeInTheDocument()
  })

  it('triggers badge printing with registration code and projectId when print icon is clicked', async () => {
    ;(printParticipantBadge as jest.Mock).mockResolvedValue({ success: true })
    ;(getParticipantById as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        ...participant('REG-001', 'Alice'),
        residence_country: 'Thailand',
      },
    })

    render(
      <ParticipantList
        participants={[participant('REG-001', 'Alice')]}
        projectId="07626a19-001d-4675-addd-3a92e3f46d47"
        attendeeTypes={[{ type_code: 'VI', type_name: 'Visitor', prefix_code: 'V', need_questionnaire: false, can_book_conference: true, created_at: '' }]}
        events={[]}
      />,
    )

    const printButtons = screen.getAllByRole('button', { name: /print badge/i })
    expect(printButtons.length).toBeGreaterThan(0)
    fireEvent.click(printButtons[0])

    await waitFor(() => {
      expect(printParticipantBadge).toHaveBeenCalledWith('07626a19-001d-4675-addd-3a92e3f46d47', 'uuid-REG-001')
      expect(printBadge).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Alice',
          registrationCode: 'REG-001',
        }),
        '07626a19-001d-4675-addd-3a92e3f46d47'
      )
    })
  })
})
