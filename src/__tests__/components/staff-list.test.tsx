import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StaffList } from '@/components/staff-list'
import { updateProjectStaff, getStaffTypes, getProjectStaffEventPermissions, updateProjectStaffEventPermissions } from '@/app/actions/staff'
import { getEvents } from '@/app/actions/settings'

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
  usePathname: () => '/admin/staff',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/app/actions/staff', () => ({
  createProjectStaff: jest.fn(),
  updateProjectStaff: jest.fn().mockResolvedValue({ success: true, data: {} }),
  deleteProjectStaff: jest.fn(),
  printProjectStaffBadge: jest.fn(),
  getStaffTypes: jest.fn().mockResolvedValue({ success: true, data: [{ type_code: 'ST', type_name: 'Staff' }] }),
  getProjectStaffEventPermissions: jest.fn().mockResolvedValue({ success: true, data: { allow_all: true, event_uuids: [] } }),
  updateProjectStaffEventPermissions: jest.fn().mockResolvedValue({ success: true, data: {} }),
}))

jest.mock('@/app/actions/settings', () => ({
  getEvents: jest.fn().mockResolvedValue({ success: true, events: [] }),
}))

jest.mock('@/components/CountrySelector', () => ({
  CountrySelector: ({ value, onChange }: any) => (
    <input
      data-testid="country-selector"
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <button type="button">{children}</button>,
  SelectValue: () => <span />,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, onClick, className, id }: any) => (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      onClick={(e) => {
        onClick?.(e)
        onCheckedChange?.(!checked)
      }}
      className={className}
    />
  ),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    promise: jest.fn(),
  },
}))

const mockStaff = {
  staff_uuid: 'staff-1',
  title: 'Mr.',
  first_name: 'John',
  last_name: 'Doe',
  company_name: 'Acme Corp',
  staff_code: 'ST0001',
  staff_type_code: 'ST',
  is_active: true,
  is_business_matching: true,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: null,
  residence_country: 'Thailand',
}

const initialData = {
  items: [mockStaff],
  total_items: 1,
  page: 1,
  limit: 20,
  total_pages: 1,
}

const PROJECT_ID = '07626a19-001d-4675-addd-3a92e3f46d47'

describe('StaffList Business Matching Toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('allows unticking Business Matching Access and updates with is_business_matching = false', async () => {
    render(<StaffList initialData={initialData} projectId={PROJECT_ID} />)

    // Find and click the edit button (Pencil icon)
    const editButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-pencil'))
    expect(editButtons.length).toBeGreaterThan(0)
    fireEvent.click(editButtons[0])

    // Wait for Edit Staff dialog to open
    expect(screen.getByText('Edit Staff')).toBeInTheDocument()

    // Find Business Matching Access toggle checkbox
    const bmCheckbox = document.getElementById('edit_staff_is_business_matching')
    expect(bmCheckbox).toBeInTheDocument()

    // Click to untick
    fireEvent.click(bmCheckbox!)

    // Submit form by clicking Update
    const updateButton = screen.getByRole('button', { name: /update/i })
    fireEvent.click(updateButton)

    await waitFor(() => {
      expect(updateProjectStaff).toHaveBeenCalledWith(
        PROJECT_ID,
        'staff-1',
        expect.objectContaining({
          is_business_matching: false,
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Acme Corp',
        })
      )
    })
  })

  it('allows unticking Business Matching Feature in Permissions dialog and saves with is_business_matching = false', async () => {
    render(<StaffList initialData={initialData} projectId={PROJECT_ID} />)

    // Find and click the permissions button (ShieldCheck icon)
    const permButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-shield-check') || b.getAttribute('title') === 'Manage Permissions')
    expect(permButtons.length).toBeGreaterThan(0)
    fireEvent.click(permButtons[0])

    // Wait for permissions dialog
    await waitFor(() => {
      expect(screen.getByText('Staff Permissions')).toBeInTheDocument()
    })

    // Find Business Matching Feature toggle
    const bmCheckbox = document.getElementById('perm_allow_business_matching')
    expect(bmCheckbox).toBeInTheDocument()

    // Click to untick
    fireEvent.click(bmCheckbox!)

    // Click Save Permissions
    const saveButton = screen.getByRole('button', { name: /save permissions/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(updateProjectStaff).toHaveBeenCalledWith(
        PROJECT_ID,
        'staff-1',
        expect.objectContaining({
          is_business_matching: false,
        })
      )
    })
  })
})
