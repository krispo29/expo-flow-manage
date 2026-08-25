import api from '@/lib/api'
import {
  createProjectStaff,
  updateProjectStaff,
  getProjectStaffs,
  deleteProjectStaff,
  getProjectStaffEventPermissions,
  updateProjectStaffEventPermissions,
} from '@/app/actions/staff'

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}))

jest.mock('@/lib/server-auth', () => ({
  requireServerAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Bearer token', 'X-Project-UUID': 'proj-123' }),
}))

jest.mock('@/lib/authorization', () => ({
  requireProjectContext: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const mockApi = api as jest.Mocked<typeof api>
const PROJECT_UUID = '07626a19-001d-4675-addd-3a92e3f46d47'
const STAFF_UUID = 'staff-uuid-123'

describe('Staff Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('updateProjectStaff', () => {
    it('updates staff with is_business_matching set to false', async () => {
      mockApi.put.mockResolvedValueOnce({
        data: {
          data: {
            staff_uuid: STAFF_UUID,
            is_business_matching: false,
          },
        },
      } as any)

      const result = await updateProjectStaff(PROJECT_UUID, STAFF_UUID, {
        title: 'Mr.',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Co',
        staff_type_code: 'ST',
        residence_country: 'Thailand',
        job_position: 'Coordinator',
        mobile_country_code: '+66',
        mobile_number: '812345678',
        email: 'john@example.com',
        is_business_matching: false,
      })

      expect(result.success).toBe(true)
      expect(mockApi.put).toHaveBeenCalledWith(
        `/v1/admin/project/staff/${STAFF_UUID}`,
        {
          title: 'Mr.',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Co',
          staff_type_code: 'ST',
          residence_country: 'Thailand',
          job_position: 'Coordinator',
          mobile_country_code: '+66',
          mobile_number: '812345678',
          email: 'john@example.com',
          is_business_matching: false,
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      )
    })

    it('updates staff with is_business_matching set to true', async () => {
      mockApi.put.mockResolvedValueOnce({
        data: {
          data: {
            staff_uuid: STAFF_UUID,
            is_business_matching: true,
          },
        },
      } as any)

      const result = await updateProjectStaff(PROJECT_UUID, STAFF_UUID, {
        title: 'Mr.',
        first_name: 'John',
        last_name: 'Doe',
        company_name: 'Test Co',
        staff_type_code: 'ONSITE',
        residence_country: 'Thailand',
        is_business_matching: true,
      })

      expect(result.success).toBe(true)
      expect(mockApi.put).toHaveBeenCalledWith(
        `/v1/admin/project/staff/${STAFF_UUID}`,
        {
          title: 'Mr.',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'Test Co',
          staff_type_code: 'ST',
          residence_country: 'Thailand',
          is_business_matching: true,
        },
        expect.anything()
      )
    })
  })

  describe('createProjectStaff', () => {
    it('includes the new contact fields in the create payload', async () => {
      mockApi.post.mockResolvedValueOnce({ data: { data: { staff_uuid: STAFF_UUID } } } as never)

      const result = await createProjectStaff(PROJECT_UUID, {
        title: 'Ms.', first_name: 'Jane', last_name: 'Doe', company_name: 'Test Co', staff_type_code: 'ST',
        residence_country: 'Thailand', job_position: 'Manager', mobile_country_code: '+66', mobile_number: '812345679', email: 'jane@example.com',
      })

      expect(result.success).toBe(true)
      expect(mockApi.post).toHaveBeenCalledWith(
        '/v1/admin/project/staff',
        expect.objectContaining({ job_position: 'Manager', mobile_country_code: '+66', mobile_number: '812345679', email: 'jane@example.com' }),
        expect.anything(),
      )
    })
  })

  describe('updateProjectStaffEventPermissions', () => {
    it('updates staff event permissions with empty array for allow all', async () => {
      mockApi.put.mockResolvedValueOnce({
        data: {
          data: {
            allow_all: true,
            event_uuids: [],
          },
        },
      } as any)

      const result = await updateProjectStaffEventPermissions(PROJECT_UUID, STAFF_UUID, [])

      expect(result.success).toBe(true)
      expect(mockApi.put).toHaveBeenCalledWith(
        `/v1/admin/project/staff/${STAFF_UUID}/event-permissions`,
        {
          event_uuids: [],
        },
        expect.anything()
      )
    })
  })
})
