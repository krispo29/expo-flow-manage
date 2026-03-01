jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}))

import { mockService } from '@/lib/mock-service'
import type {
  User,
  Project,
  Organizer,
  Participant,
  Conference,
  Exhibitor,
  Staff,
  InvitationCode,
  SystemSettings,
} from '@/lib/mock-service'

describe('MockService Singleton', () => {
  it('should be defined', () => {
    expect(mockService).toBeDefined()
  })

  describe('Users', () => {
    it('should have default users', () => {
      const users = (mockService as unknown as { users: User[] }).users
      expect(users.length).toBe(3)
    })

    it('should have admin user', () => {
      const users = (mockService as unknown as { users: User[] }).users
      const admin = users.find((u) => u.username === 'admin')
      expect(admin).toBeDefined()
      expect(admin?.role).toBe('ADMIN')
    })

    it('should have organizer user', () => {
      const users = (mockService as unknown as { users: User[] }).users
      const organizer = users.find((u) => u.username === 'organizer')
      expect(organizer).toBeDefined()
      expect(organizer?.role).toBe('ORGANIZER')
    })

    it('should have exhibitor user', () => {
      const users = (mockService as unknown as { users: User[] }).users
      const exhibitor = users.find((u) => u.username === 'exhibitor')
      expect(exhibitor).toBeDefined()
      expect(exhibitor?.role).toBe('EXHIBITOR')
    })
  })

  describe('Projects', () => {
    it('should have default projects', () => {
      const projectsList = (mockService as unknown as { projectsList: Project[] }).projectsList
      expect(projectsList.length).toBe(3)
    })

    it('should include ILDEX Vietnam 2026', () => {
      const projectsList = (mockService as unknown as { projectsList: Project[] }).projectsList
      const ildex = projectsList.find((p) => p.id === 'ildex-vietnam-2026')
      expect(ildex).toBeDefined()
      expect(ildex?.name).toBe('ILDEX VIETNAM 2026')
    })

    it('should include Horti Agri Next', () => {
      const projectsList = (mockService as unknown as { projectsList: Project[] }).projectsList
      const horti = projectsList.find((p) => p.id === 'horti-agri')
      expect(horti).toBeDefined()
      expect(horti?.name).toBe('Horti Agri Next')
    })

    it('should include VIV Asia 2027', () => {
      const projectsList = (mockService as unknown as { projectsList: Project[] }).projectsList
      const viv = projectsList.find((p) => p.id === 'viv-asia-2027')
      expect(viv).toBeDefined()
      expect(viv?.name).toBe('VIV Asia 2027')
    })

    it('should have createdAt dates', () => {
      const projectsList = (mockService as unknown as { projectsList: Project[] }).projectsList
      projectsList.forEach((project) => {
        expect(project.createdAt).toBeInstanceOf(Date)
      })
    })
  })

  describe('Settings', () => {
    it('should have default settings', () => {
      const settings = (mockService as unknown as { settings: SystemSettings }).settings
      expect(settings).toBeDefined()
    })

    it('should have default rooms', () => {
      const settings = (mockService as unknown as { settings: SystemSettings }).settings
      expect(settings.rooms.length).toBe(3)
      expect(settings.rooms).toContain('Grand Ballroom')
      expect(settings.rooms).toContain('Room 304')
      expect(settings.rooms).toContain('Conference Hall B')
    })

    it('should have event title', () => {
      const settings = (mockService as unknown as { settings: SystemSettings }).settings
      expect(settings.eventTitle).toBe('ILDEX Vietnam 2024')
    })

    it('should have site URL', () => {
      const settings = (mockService as unknown as { settings: SystemSettings }).settings
      expect(settings.siteUrl).toBe('https://www.ildexandhortiagri-vietnam.com')
    })
  })

  describe('Invitation Codes', () => {
    it('should have invitation codes', () => {
      const invitationCodes = (mockService as unknown as { invitationCodes: InvitationCode[] }).invitationCodes
      expect(invitationCodes.length).toBe(4)
    })

    it('should have valid and used codes', () => {
      const invitationCodes = (mockService as unknown as { invitationCodes: InvitationCode[] }).invitationCodes
      const used = invitationCodes.filter((c) => c.isUsed)
      const unused = invitationCodes.filter((c) => !c.isUsed)

      expect(used.length).toBe(2)
      expect(unused.length).toBe(2)
    })

    it('should have unique codes', () => {
      const invitationCodes = (mockService as unknown as { invitationCodes: InvitationCode[] }).invitationCodes
      const codes = invitationCodes.map((c) => c.code)
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(codes.length)
    })
  })

  describe('Organizers', () => {
    it('should have organizers', () => {
      const organizers = (mockService as unknown as { organizers: Organizer[] }).organizers
      expect(organizers.length).toBeGreaterThan(0)
    })

    it('should have organizer with correct role', () => {
      const organizers = (mockService as unknown as { organizers: Organizer[] }).organizers
      const admin = organizers.find((o) => o.role === 'ADMIN')
      const coordinator = organizers.filter((o) => o.role === 'COORDINATOR')
      const organizer = organizers.find((o) => o.role === 'ORGANIZER')

      expect(admin).toBeDefined()
      expect(coordinator.length).toBe(1)
      expect(organizer).toBeDefined()
    })

    it('should have valid email format', () => {
      const organizers = (mockService as unknown as { organizers: Organizer[] }).organizers
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      organizers.forEach((organizer) => {
        expect(organizer.email).toMatch(emailRegex)
      })
    })
  })

  describe('Participants', () => {
    it('should have participants', () => {
      const participants = (mockService as unknown as { participants: Participant[] }).participants
      expect(participants.length).toBe(4)
    })

    it('should have different participant types', () => {
      const participants = (mockService as unknown as { participants: Participant[] }).participants
      const types = [...new Set(participants.map((p) => p.type))]
      expect(types.length).toBeGreaterThan(1)
    })

    it('should have participants for horti-agri project', () => {
      const participants = (mockService as unknown as { participants: Participant[] }).participants
      const hortiParticipants = participants.filter((p) => p.projectId === 'horti-agri')
      expect(hortiParticipants.length).toBe(3)
    })

    it('should have participants with required fields', () => {
      const participants = (mockService as unknown as { participants: Participant[] }).participants
      participants.forEach((participant) => {
        expect(participant.id).toBeDefined()
        expect(participant.projectId).toBeDefined()
        expect(participant.type).toBeDefined()
      })
    })

    it('should have some attended status', () => {
      const participants = (mockService as unknown as { participants: Participant[] }).participants
      const withAttended = participants.filter((p) => p.attended !== undefined)
      expect(withAttended.length).toBeGreaterThan(0)
    })
  })

  describe('Conferences', () => {
    it('should have conferences', () => {
      const conferences = (mockService as unknown as { conferences: Conference[] }).conferences
      expect(conferences.length).toBe(6)
    })

    it('should have conferences for different projects', () => {
      const conferences = (mockService as unknown as { conferences: Conference[] }).conferences
      const hortiConfs = conferences.filter((c) => c.projectId === 'horti-agri')
      const ildexConfs = conferences.filter((c) => c.projectId === 'ildex-vietnam-2026')

      expect(hortiConfs.length).toBe(4)
      expect(ildexConfs.length).toBe(2)
    })

    it('should have public and private conferences', () => {
      const conferences = (mockService as unknown as { conferences: Conference[] }).conferences
      const publicConfs = conferences.filter((c) => c.isPublic)
      const privateConfs = conferences.filter((c) => !c.isPublic)

      expect(publicConfs.length).toBe(5)
      expect(privateConfs.length).toBe(1)
    })

    it('should have valid date format', () => {
      const conferences = (mockService as unknown as { conferences: Conference[] }).conferences
      conferences.forEach((conf) => {
        expect(conf.date).toBeInstanceOf(Date)
      })
    })

    it('should have start and end time', () => {
      const conferences = (mockService as unknown as { conferences: Conference[] }).conferences
      conferences.forEach((conf) => {
        expect(conf.startTime).toBeDefined()
        expect(conf.endTime).toBeDefined()
      })
    })
  })

  describe('Exhibitors', () => {
    it('should have exhibitors', () => {
      const exhibitors = (mockService as unknown as { exhibitors: Exhibitor[] }).exhibitors
      expect(exhibitors.length).toBe(6)
    })

    it('should have exhibitors for different projects', () => {
      const exhibitors = (mockService as unknown as { exhibitors: Exhibitor[] }).exhibitors
      const hortiExhibitors = exhibitors.filter((e) => e.projectId === 'horti-agri')
      const ildexExhibitors = exhibitors.filter((e) => e.projectId === 'ildex-vietnam-2026')
      const vivExhibitors = exhibitors.filter((e) => e.projectId === 'viv-asia-2027')

      expect(hortiExhibitors.length).toBe(2)
      expect(ildexExhibitors.length).toBe(2)
      expect(vivExhibitors.length).toBe(2)
    })

    it('should have booth numbers', () => {
      const exhibitors = (mockService as unknown as { exhibitors: Exhibitor[] }).exhibitors
      exhibitors.forEach((exhibitor) => {
        expect(exhibitor.boothNumber).toBeDefined()
        expect(exhibitor.boothNumber.length).toBeGreaterThan(0)
      })
    })

    it('should have quota and overquota', () => {
      const exhibitors = (mockService as unknown as { exhibitors: Exhibitor[] }).exhibitors
      exhibitors.forEach((exhibitor) => {
        expect(typeof exhibitor.quota).toBe('number')
        expect(typeof exhibitor.overQuota).toBe('number')
        expect(exhibitor.quota).toBeGreaterThanOrEqual(0)
        expect(exhibitor.overQuota).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have contact information', () => {
      const exhibitors = (mockService as unknown as { exhibitors: Exhibitor[] }).exhibitors
      exhibitors.forEach((exhibitor) => {
        expect(exhibitor.contactName).toBeDefined()
        expect(exhibitor.email).toBeDefined()
        expect(exhibitor.phone).toBeDefined()
      })
    })
  })

  describe('Staff', () => {
    it('should have staff members', () => {
      const staffMembers = (mockService as unknown as { staffMembers: Staff[] }).staffMembers
      expect(staffMembers.length).toBe(5)
    })

    it('should have staff with exhibitor IDs', () => {
      const staffMembers = (mockService as unknown as { staffMembers: Staff[] }).staffMembers
      staffMembers.forEach((staff) => {
        expect(staff.exhibitorId).toBeDefined()
      })
    })

    it('should have staff with required fields', () => {
      const staffMembers = (mockService as unknown as { staffMembers: Staff[] }).staffMembers
      staffMembers.forEach((staff) => {
        expect(staff.firstName).toBeDefined()
        expect(staff.lastName).toBeDefined()
        expect(staff.email).toBeDefined()
        expect(staff.mobile).toBeDefined()
        expect(staff.position).toBeDefined()
      })
    })

    it('should have staff with titles', () => {
      const staffMembers = (mockService as unknown as { staffMembers: Staff[] }).staffMembers
      const titles = staffMembers.map((s) => s.title)
      expect(titles).toContain('Mr.')
      expect(titles).toContain('Ms.')
    })
  })
})
