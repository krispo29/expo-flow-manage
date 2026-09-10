import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StaffManagement } from '@/components/staff-management'
import { getExhibitorMembers } from '@/app/actions/exhibitor'
import { getOrganizerExhibitorMembers } from '@/app/actions/organizer-exhibitor'

jest.mock('@/app/actions/staff', () => ({
  createStaff: jest.fn().mockResolvedValue({ success: true }),
  updateStaff: jest.fn().mockResolvedValue({ success: true }),
  deleteStaff: jest.fn(),
  sendStaffCredentials: jest.fn(),
}))

jest.mock('@/app/actions/exhibitor', () => ({
  getExhibitorMembers: jest.fn().mockResolvedValue({ success: true, members: [] }),
  toggleLeadScannerMemberStatus: jest.fn(),
  updateLeadScannerStaffQuota: jest.fn(),
  toggleStatusStaff: jest.fn(),
}))

jest.mock('@/app/actions/organizer-exhibitor', () => ({
  getOrganizerExhibitorMembers: jest.fn().mockResolvedValue({ success: true, members: [] }),
  createOrganizerMember: jest.fn().mockResolvedValue({ success: true }),
  updateOrganizerMember: jest.fn().mockResolvedValue({ success: true }),
  toggleStatusOrganizerMember: jest.fn(),
  resendEmailOrganizerMember: jest.fn(),
  toggleOrganizerLeadScannerMemberStatus: jest.fn(),
  updateOrganizerLeadScannerStaffQuota: jest.fn(),
}))

jest.mock('@/components/CountrySelector', () => ({
  CountrySelector: ({ value, onChange }: any) => (
    <input data-testid="country-selector" value={value} onChange={event => onChange(event.target.value)} />
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={event => onValueChange(event.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const exhibitor = {
  companyName: 'Acme Corp',
  phone: '020000000',
  country: 'Thailand',
}

const customTitleMember = {
  registration_uuid: 'member-1',
  registration_code: 'ST0001',
  title: 'Others',
  title_other: 'Mx.',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.com',
  mobile_number: '0812345678',
  job_position: 'Engineer',
  company_name: 'Acme Corp',
  company_country: 'Thailand',
  company_tel: '020000000',
  staff_type_code: 'EXHIBITOR',
  is_active: true,
}

const roles = ['ADMIN', 'ORGANIZER'] as const

describe.each(roles)('Exhibitor StaffManagement (%s)', role => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getExhibitorMembers).mockResolvedValue({ success: true, members: [] } as never)
    jest.mocked(getOrganizerExhibitorMembers).mockResolvedValue({ success: true, members: [] } as never)
  })

  it('shows the custom title input when adding staff', async () => {
    render(
      <StaffManagement
        exhibitorId="exhibitor-1"
        projectId="project-1"
        exhibitor={exhibitor}
        userRole={role}
      />,
    )

    await waitFor(() => expect(screen.getByText('No staff members added yet.')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /add staff/i }))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Others' } })

    expect(screen.getByLabelText(/specify title/i)).toBeRequired()
  })

  it('loads the existing custom title when editing staff', async () => {
    const membersAction = role === 'ORGANIZER' ? getOrganizerExhibitorMembers : getExhibitorMembers
    jest.mocked(membersAction).mockResolvedValue({ success: true, members: [customTitleMember] } as never)

    render(
      <StaffManagement
        exhibitorId="exhibitor-1"
        projectId="project-1"
        exhibitor={exhibitor}
        userRole={role}
      />,
    )

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument())

    const editButton = screen.getAllByRole('button').find(button => button.querySelector('svg.lucide-pencil'))
    expect(editButton).toBeDefined()
    fireEvent.click(editButton!)

    expect(screen.getByLabelText(/specify title/i)).toHaveValue('Mx.')
  })
})
