import { render, screen } from '@testing-library/react'
import { ParticipantList } from '@/components/participant-list'

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

const participant = (registration_code: string, first_name: string) => ({
  registration_uuid: registration_code,
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
})
