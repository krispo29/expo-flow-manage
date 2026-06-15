import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ConferenceList } from '@/components/conference-list'
import type { Conference } from '@/app/actions/conference'
import { copyTextToClipboard } from '@/lib/clipboard'
import { toast } from 'sonner'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}))

jest.mock('@/app/actions/conference', () => ({
  getConferenceLogs: jest.fn(),
  toggleConferenceActive: jest.fn(),
  getRooms: jest.fn(() => new Promise(() => undefined)),
}))

jest.mock('@/app/actions/organizer-conference', () => ({
  getOrganizerConferenceLogs: jest.fn(),
  toggleOrganizerConferenceActive: jest.fn(),
  getOrganizerRooms: jest.fn(() => new Promise(() => undefined)),
}))

jest.mock('@/lib/clipboard', () => ({
  copyTextToClipboard: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const conference: Conference = {
  conference_uuid: 'conference-1',
  project_uuid: 'project-1',
  title: 'Future of AgriTech',
  speaker_name: '',
  speaker_info: '',
  show_date: '2026-06-15',
  start_time: '10:00:00',
  end_time: '11:00:00',
  location: 'room-1',
  quota: 100,
  remaining_seats: 84,
  conference_type: 'public',
  reserved_count: 16,
  status: 'available',
  is_active: true,
  created_at: '2026-06-01T00:00:00Z',
  can_book: true,
  unique_link: 'https://registration.example.com/conferences/conference-1',
}

describe('ConferenceList unique link', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the registration link and copies the full value', async () => {
    render(<ConferenceList conferences={[conference]} projectId="project-1" userRole="ORGANIZER" />)

    expect(screen.getByText('Registration Link')).toBeInTheDocument()
    expect(screen.getByText(conference.unique_link!)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: `Copy registration link for ${conference.title}` }))

    await waitFor(() => {
      expect(copyTextToClipboard).toHaveBeenCalledWith(conference.unique_link)
      expect(toast.success).toHaveBeenCalledWith('Registration link copied')
    })
  })

  it('does not show the registration link row when the value is missing', () => {
    render(
      <ConferenceList
        conferences={[{ ...conference, unique_link: undefined }]}
        projectId="project-1"
        userRole="ORGANIZER"
      />
    )

    expect(screen.queryByText('Registration Link')).not.toBeInTheDocument()
  })

  it('shows an error toast when copying fails', async () => {
    jest.mocked(copyTextToClipboard).mockRejectedValueOnce(new Error('Clipboard unavailable'))
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<ConferenceList conferences={[conference]} projectId="project-1" userRole="ORGANIZER" />)
    fireEvent.click(screen.getByRole('button', { name: `Copy registration link for ${conference.title}` }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to copy registration link')
    })

    consoleError.mockRestore()
  })
})
