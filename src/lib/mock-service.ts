import { v4 as uuidv4 } from 'uuid';

// Types (mirrors functionality of Prisma models)
export interface User {
  id: string;
  username: string;
  password: string; // Plain text or hashed, but we'll mock login check
  role: 'ADMIN' | 'ORGANIZER' | 'EXHIBITOR';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Organizer {
  id: string;
  username: string;
  email: string;
  role: string;
  projectId: string; // Linked to project
  createdAt: Date;
}

export interface Participant {
  id: string;
  projectId: string;
  type: string;
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  company?: string;
  position?: string;
  room?: string;
  attended?: boolean;
  createdAt: Date;
}

export interface Conference {
  id: string;
  projectId: string;
  topic: string;
  date: Date;
  startTime: string;
  endTime: string;
  room?: string;
  capacity?: number;
  detail?: string;
  speakerInfo?: string;
  photoUrl?: string;
  isPublic: boolean;
  showOnReg: boolean;
  allowPreReg: boolean;
  createdAt: Date;
}

export interface Exhibitor {
  id: string;
  projectId: string;
  name: string; // This seems to be unused or duplicate of companyName? Keeping for safety.
  companyName: string;
  registrationId?: string; // Username
  password?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  boothNumber: string;
  contactName: string;
  email: string;
  phone: string;
  fax?: string;
  website?: string;
  quota: number;
  overQuota: number;
  inviteCode?: string;
  createdAt: Date;
}

export interface Staff {
  id: string; // Sequence based: exhibitorId-NN (e.g. ex-1-01)
  exhibitorId: string;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  position: string;
  createdAt: Date;
}

export interface ImportHistory {
  id: number;
  filename: string;
  date: string;
  records: number;
  status: string;
}

export interface SystemSettings {
  siteUrl: string;
  eventDate: Date;
  cutoffDate: Date;
  eventTitle: string;
  eventSubtitle: string;
  rooms: string[];
}

export interface InvitationCode {
  id: string;
  companyName: string;
  code: string;
  isUsed: boolean;
  createdAt: Date;
}

// Mock Data Store
class MockService {
  private readonly users: User[] = [
    { id: '1', username: 'admin', password: '123', role: 'ADMIN' },
    { id: '2', username: 'organizer', password: '123', role: 'ORGANIZER' },
    { id: '3', username: 'exhibitor', password: '123', role: 'EXHIBITOR' },
  ];
  
  private projectsList: Project[] = [
    { id: 'ildex-vietnam-2026', name: 'ILDEX VIETNAM 2026', description: 'International Livestock, Dairy, Meat Processing and Aquaculture Exposition', createdAt: new Date() },
    { id: 'horti-agri', name: 'Horti Agri Next', description: 'Horticultural & Agricultural Technologies', createdAt: new Date() },
    { id: 'viv-asia-2027', name: 'VIV Asia 2027', description: 'International Trade Show from Feed to Food', createdAt: new Date() }
  ];

  private settings: SystemSettings = {
    siteUrl: 'https://www.ildexandhortiagri-vietnam.com',
    eventDate: new Date('2024-05-29'),
    cutoffDate: new Date('2024-05-20'),
    eventTitle: 'ILDEX Vietnam 2024',
    eventSubtitle: 'International Livestock, Dairy, Meat Processing and Aquaculture Exposition',
    rooms: ['Grand Ballroom', 'Room 304', 'Conference Hall B']
  };

  private invitationCodes: InvitationCode[] = [
    {
      id: 'inv-1',
      companyName: 'Partner Corp',
      code: 'VIP2026',
      isUsed: true,
      createdAt: new Date('2025-01-15')
    },
    {
      id: 'inv-2',
      companyName: 'Media Group One',
      code: 'MEDIA26',
      isUsed: false,
      createdAt: new Date('2025-02-01')
    },
    {
      id: 'inv-3',
      companyName: 'Tech Sponsors Inc',
      code: 'SPON26',
      isUsed: false,
      createdAt: new Date('2025-02-10')
    },
    {
      id: 'inv-4',
      companyName: 'Global Exhibitions',
      code: 'GLOBAL26',
      isUsed: true,
      createdAt: new Date('2025-01-20')
    }
  ];

  private readonly recentImports: ImportHistory[] = [
    { id: 1, filename: "scanner_data_2025-02-14.csv", date: "2025-02-14 10:30 AM", records: 154, status: "Success" },
    { id: 2, filename: "scanner_data_2025-02-13.csv", date: "2025-02-13 04:15 PM", records: 89, status: "Success" },
    { id: 3, filename: "scanner_data_2025-02-12_part1.csv", date: "2025-02-12 09:00 AM", records: 210, status: "Pending" },
  ];

  private organizers: Organizer[] = [
    {
      id: "org-1",
      username: "mike_admin",
      email: "mike@example.com",
      role: "ADMIN",
      projectId: "horti-agri",
      createdAt: new Date(),
    },
    {
      id: "org-2",
      username: "kris_coord",
      email: "kris@example.com",
      role: "COORDINATOR",
      projectId: "horti-agri",
      createdAt: new Date(),
    },
    {
      id: "org-3",
      username: "organizer",
      email: "organizer@example.com",
      role: "ORGANIZER",
      projectId: "ildex-vietnam-2026",
      createdAt: new Date(),
    },
  ];
  private participants: Participant[] = [
    {
      id: "p-1",
      projectId: "horti-agri",
      type: "VIP",
      code: "VIP-001",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      mobile: "+66 81 111 2222",
      company: "AgriCorp",
      position: "CEO",
      room: "VIP Lounge",
      attended: false,
      createdAt: new Date(),
    },
    {
      id: "p-2",
      projectId: "horti-agri",
      type: "SPEAKER",
      code: "SPK-002",
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@techagri.com",
      mobile: "+66 82 222 3333",
      company: "TechAgri Solutions",
      position: "Lead Researcher",
      room: "Hall A",
      attended: true,
      createdAt: new Date(),
    },
    {
      id: "p-3",
      projectId: "horti-agri",
      type: "INDIVIDUAL",
      code: "REG-103",
      firstName: "Somchai",
      lastName: "K.",
      email: "somchai@farm.th",
      mobile: "+66 83 333 4444",
      company: "Local Farm",
      position: "Owner",
      createdAt: new Date(),
    },
    // Also add for the hardcoded ID cm743xxx
    {
      id: "p-4",
      projectId: "cm743xxx",
      type: "PRESS",
      code: "PRS-501",
      firstName: "Alice",
      lastName: "Wonder",
      email: "alice@news.com",
      company: "AgriNews",
      position: "Reporter",
      createdAt: new Date(),
    }
  ];
  private conferences: Conference[] = [
    {
      id: "conf-1",
      projectId: "horti-agri",
      topic: "Future of Hydroponics 2026",
      date: new Date('2026-03-15'),
      startTime: "09:00",
      endTime: "10:30",
      room: "Grand Ballroom",
      capacity: 100,
      detail: "An in-depth look at the latest advancements in hydroponic systems, focusing on sustainability and high-yield crop production in urban environments.",
      speakerInfo: "Dr. Somchai Green, Head of Agronomy at Thai AgriTech University.",
      isPublic: true,
      showOnReg: true,
      allowPreReg: true,
      createdAt: new Date(),
    },
    {
      id: "conf-2",
      projectId: "horti-agri",
      topic: "Automated Pest Control Systems",
      date: new Date('2026-03-15'),
      startTime: "11:00",
      endTime: "12:30",
      room: "Meeting Room 2",
      capacity: 50,
      detail: "Exploring the integration of AI and robotics in modern pest management to reduce pesticide usage and improve crop health monitoring.",
      speakerInfo: "Eng. Wichai Smart, Lead Robotics Engineer at SmartFarm Solutions.",
      isPublic: true,
      showOnReg: true,
      allowPreReg: false,
      createdAt: new Date(),
    },
    {
      id: "conf-3",
      projectId: "ildex-vietnam-2026",
      topic: "Poultry Health Management in Tropical Climates",
      date: new Date('2026-06-12'),
      startTime: "09:30",
      endTime: "11:00",
      room: "Conference Hall B",
      capacity: 150,
      detail: "Best practices for maintaining poultry health and productivity in high heat and humidity, including vaccination schedules and biosecurity measures.",
      speakerInfo: "Dr. Nguyen Van Poultry, Senior Veterinarian at ILDEX Vietnam Health.",
      isPublic: true,
      showOnReg: true,
      allowPreReg: true,
      createdAt: new Date(),
    },
    {
      id: "conf-4",
      projectId: "ildex-vietnam-2026",
      topic: "Advances in Aquaculture Feed Technology",
      date: new Date('2026-06-12'),
      startTime: "13:30",
      endTime: "15:00",
      room: "Room 304",
      capacity: 80,
      detail: "Discussing the latest research in sustainable fish and shrimp feed, including alternative protein sources and optimized feeding strategies for Vietnamese farms.",
      speakerInfo: "Prof. Tran Aqua, Researcher at University of Fisheries, Nha Trang.",
      isPublic: true,
      showOnReg: true,
      allowPreReg: false,
      createdAt: new Date(),
    },
    {
      id: "conf-5",
      projectId: "horti-agri",
      topic: "Smart Greenhouses: IoT & Automation",
      date: new Date('2026-03-16'),
      startTime: "10:00",
      endTime: "11:30",
      room: "Tech Lab 1",
      capacity: 60,
      detail: "A hands-on overview of IoT sensors and automated cooling/irrigation systems for commercial greenhouse operations, geared towards efficiency and data-driven decisions.",
      speakerInfo: "Ms. Kanya Tech, CEO of Greenhouse IoT Systems.",
      isPublic: true,
      showOnReg: true,
      allowPreReg: true,
      createdAt: new Date(),
    },
    {
      id: "conf-6",
      projectId: "horti-agri",
      topic: "Economic Trends in Southeast Asian Agriculture",
      date: new Date('2026-03-16'),
      startTime: "14:00",
      endTime: "16:00",
      room: "Auditorium",
      capacity: 250,
      detail: "Analyzing market shifts, trade agreements, and emerging consumer demands affecting the agricultural sector across Thailand, Vietnam, and Indonesia.",
      speakerInfo: "Mr. Anan K., Regional Market Analyst at Asia Livestock Group.",
      isPublic: false,
      showOnReg: false,
      allowPreReg: false,
      createdAt: new Date(),
    }
  ];
  private exhibitors: Exhibitor[] = [
    // ILDEX Vietnam 2026
    {
      id: "ex-1",
      projectId: "ildex-vietnam-2026",
      name: "AgroTech Solutions",
      companyName: "AgroTech Solutions",
      registrationId: "agrotech",
      password: "password123",
      address: "123 High-Tech Park",
      city: "Ho Chi Minh City",
      country: "Vietnam",
      boothNumber: "A101",
      contactName: "Nguyen Van A",
      email: "a@agrotech.vn",
      phone: "+84 123 456 789",
      quota: 5,
      overQuota: 0,
      createdAt: new Date(),
    },
    {
      id: "ex-2",
      projectId: "ildex-vietnam-2026",
      name: "BioFeed International",
      companyName: "BioFeed International",
      registrationId: "biofeed",
      password: "password123",
      address: "45 Industrial Zone",
      city: "Hanoi",
      country: "Vietnam",
      boothNumber: "B205",
      contactName: "Tran Thi B",
      email: "b@biofeed.com",
      phone: "+84 987 654 321",
      quota: 10,
      overQuota: 2,
      createdAt: new Date(),
    },
    // Horti Agri Next (The project in the screenshot)
    {
      id: "ex-4",
      projectId: "horti-agri",
      name: "Greenery Systems",
      companyName: "Greenery Systems",
      registrationId: "greenery",
      password: "password123",
      address: "12 Green Lane",
      city: "Bangkok",
      country: "Thailand",
      boothNumber: "H-101",
      contactName: "Somsak G",
      email: "somsak@greenery.th",
      phone: "+66 81 234 5678",
      quota: 12,
      overQuota: 1,
      createdAt: new Date(),
    },
    {
      id: "ex-5",
      projectId: "horti-agri",
      name: "Smart Farm Tech",
      companyName: "Smart Farm Tech",
      registrationId: "smartfarm",
      password: "password123",
      address: "88 Agri Plaza",
      city: "Chiang Mai",
      country: "Thailand",
      boothNumber: "H-202",
      contactName: "Wichai S",
      email: "wichai@smartfarm.com",
      phone: "+66 53 111 222",
      quota: 15,
      overQuota: 0,
      createdAt: new Date(),
    },
    // VIV Asia 2027
    {
      id: "ex-6",
      projectId: "viv-asia-2027",
      name: "Asia Livestock Group",
      companyName: "Asia Livestock Group",
      registrationId: "asialivestock",
      password: "password123",
      address: "555 Sukhumvit Rd",
      city: "Bangkok",
      country: "Thailand",
      boothNumber: "V-99",
      contactName: "Anan K",
      email: "anan@asialivestock.com",
      phone: "+66 2 999 8888",
      quota: 20,
      overQuota: 4,
      createdAt: new Date(),
    },
    {
      id: "ex-7",
      projectId: "viv-asia-2027",
      name: "Default Exhibitor",
      companyName: "Default Exhibitor",
      registrationId: "exhibitor",
      password: "123",
      boothNumber: "V-100",
      contactName: "Exhibitor User",
      email: "exhibitor@example.com",
      phone: "+66 2 000 0000",
      quota: 5,
      overQuota: 0,
      createdAt: new Date(),
    },
  ];
  private staffMembers: Staff[] = [
    {
      id: "ex-1-01",
      exhibitorId: "ex-1",
      title: "Mr.",
      firstName: "Le Van",
      lastName: "D",
      email: "d@agrotech.vn",
      mobile: "+84 111 222 333",
      position: "Manager",
      createdAt: new Date(),
    },
    {
      id: "ex-1-02",
      exhibitorId: "ex-1",
      title: "Ms.",
      firstName: "Pham Thi",
      lastName: "E",
      email: "e@agrotech.vn",
      mobile: "+84 444 555 666",
      position: "Engineer",
      createdAt: new Date(),
    },
    {
      id: "ex-2-01",
      exhibitorId: "ex-2",
      title: "Mr.",
      firstName: "Hoang Van",
      lastName: "F",
      email: "f@biofeed.com",
      mobile: "+84 777 888 999",
      position: "Sales",
      createdAt: new Date(),
    },
    {
      id: "ex-4-01",
      exhibitorId: "ex-4",
      title: "Ms.",
      firstName: "Kanya",
      lastName: "P",
      email: "kanya@greenery.th",
      mobile: "+66 89 000 1111",
      position: "Operator",
      createdAt: new Date(),
    },
    {
      id: "ex-6-01",
      exhibitorId: "ex-6",
      title: "Mr.",
      firstName: "Somchai",
      lastName: "M",
      email: "somchai@asialivestock.com",
      mobile: "+66 2 888 7777",
      position: "Director",
      createdAt: new Date(),
    },
  ];

  // --- Auth & Users ---
  async findUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async findOrganizerByUsername(username: string): Promise<Organizer | undefined> {
    return this.organizers.find(o => o.username === username);
  }

  async findExhibitorByRegistrationId(regId: string): Promise<Exhibitor | undefined> {
    return this.exhibitors.find(e => e.registrationId === regId);
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return this.projectsList;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    return this.projectsList.find(p => p.id === id);
  }

  async createProject(data: Omit<Project, 'id' | 'createdAt'>): Promise<Project> {
    const newProject = {
      ...data,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.projectsList.push(newProject);
    return newProject;
  }

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<Project> {
    const index = this.projectsList.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Project not found');
    this.projectsList[index] = { ...this.projectsList[index], ...data };
    return this.projectsList[index];
  }

  async deleteProject(id: string): Promise<void> {
    this.projectsList = this.projectsList.filter(p => p.id !== id);
  }

  // --- Organizers ---
  async getOrganizers(): Promise<Organizer[]> {
     return this.organizers;
  }

  async createOrganizer(data: Omit<Organizer, 'id' | 'createdAt'>): Promise<Organizer> {
    const newOrganizer = {
        ...data,
        id: uuidv4(),
        createdAt: new Date(),
    };
    this.organizers.push(newOrganizer);
    return newOrganizer;
  }

  async updateOrganizer(id: string, data: Partial<Omit<Organizer, 'id' | 'createdAt'>>): Promise<Organizer> {
    const index = this.organizers.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Organizer not found');
    
    this.organizers[index] = { ...this.organizers[index], ...data };
    return this.organizers[index];
  }

   async deleteOrganizer(id: string): Promise<void> {
    this.organizers = this.organizers.filter(o => o.id !== id);
  }

  // --- Participants ---
  async getParticipants(projectId: string, query?: string, type?: string): Promise<Participant[]> {
    let results = this.participants.filter(p => p.projectId === projectId);

    if (type && type !== 'ALL') {
      results = results.filter(p => p.type === type);
    }

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(p => 
        (p.firstName?.toLowerCase().includes(q) || '') ||
        (p.lastName?.toLowerCase().includes(q) || '') ||
        (p.email?.toLowerCase().includes(q) || '') ||
        (p.company?.toLowerCase().includes(q) || '') ||
        (p.code?.toLowerCase().includes(q) || '')
      );
    }

    return results;
  }

  async createParticipant(data: Omit<Participant, 'id' | 'createdAt'>): Promise<Participant> {
    const newParticipant = {
      ...data,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.participants.push(newParticipant);
    return newParticipant;
  }

  async updateParticipant(id: string, data: Partial<Omit<Participant, 'id' | 'createdAt'>>): Promise<Participant> {
    const index = this.participants.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Participant not found');

    this.participants[index] = { ...this.participants[index], ...data };
    return this.participants[index];
  }

  async updateAttendance(code: string, attended: boolean): Promise<Participant | undefined> {
    const participant = this.participants.find(p => p.code === code);
    if (!participant) return undefined;
    participant.attended = attended;
    return participant;
  }

  async deleteParticipant(id: string): Promise<void> {
    this.participants = this.participants.filter(p => p.id !== id);
  }

    async createManyParticipants(data: Omit<Participant, 'id' | 'createdAt'>[]): Promise<number> {
        let count = 0;
        for (const item of data) {
            await this.createParticipant(item);
            count++;
        }
        return count;
    }

  async findParticipantByCode(code: string): Promise<Participant | undefined> {
    return this.participants.find(p => p.code?.toLowerCase() === code.toLowerCase());
  }

  async getRecentImports(): Promise<ImportHistory[]> {
    return this.recentImports;
  }

  // --- Conferences ---
  async getConferences(projectId: string): Promise<Conference[]> {
    return this.conferences.filter(c => c.projectId === projectId).sort((a,b) => a.date.getTime() - b.date.getTime());
  }

  async getConferenceById(id: string): Promise<Conference | undefined> {
    return this.conferences.find(c => c.id === id);
  }

  async createConference(data: Omit<Conference, 'id' | 'createdAt'>): Promise<Conference> {
     const newConference = {
        ...data,
        id: uuidv4(),
        createdAt: new Date(),
    }
    this.conferences.push(newConference);
    return newConference;
  }

  async updateConference(id: string, data: Partial<Omit<Conference, 'id' | 'createdAt'>>): Promise<Conference> {
    const index = this.conferences.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Conference not found');
    
    this.conferences[index] = { ...this.conferences[index], ...data };
    return this.conferences[index];
  }

  async deleteConference(id: string): Promise<void> {
    this.conferences = this.conferences.filter(c => c.id !== id);
  }

  // --- Exhibitors ---
  async getExhibitors(projectId: string): Promise<(Exhibitor & { _count: { staff: number } })[]> {
    return this.exhibitors
      .filter(e => e.projectId === projectId)
      .map(e => ({
        ...e,
        _count: {
          staff: this.staffMembers.filter(s => s.exhibitorId === e.id).length
        }
      }));
  }

  async getExhibitorById(id: string): Promise<(Exhibitor & { staff: Staff[] }) | undefined> {
    const exhibitor = this.exhibitors.find(e => e.id === id);
    if (!exhibitor) return undefined;
    return {
      ...exhibitor,
      staff: this.staffMembers.filter(s => s.exhibitorId === id)
    };
  }

  async createExhibitor(data: Omit<Exhibitor, 'id' | 'createdAt'>): Promise<Exhibitor> {
    const newExhibitor = {
      ...data,
      id: uuidv4(),
      createdAt: new Date()
    };
    this.exhibitors.push(newExhibitor);
    return newExhibitor;
  }

  async updateExhibitor(id: string, data: Partial<Omit<Exhibitor, 'id' | 'createdAt'>>): Promise<Exhibitor> {
    const index = this.exhibitors.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Exhibitor not found');
    this.exhibitors[index] = { ...this.exhibitors[index], ...data };
    return this.exhibitors[index];
  }

  async deleteExhibitor(id: string): Promise<void> {
    this.exhibitors = this.exhibitors.filter(e => e.id !== id);
    this.staffMembers = this.staffMembers.filter(s => s.exhibitorId !== id);
  }

  // --- Staff ---
  async getStaffByExhibitorId(exhibitorId: string): Promise<Staff[]> {
    return this.staffMembers.filter(s => s.exhibitorId === exhibitorId);
  }

  async getStaffById(id: string): Promise<Staff | undefined> {
    return this.staffMembers.find(s => s.id === id);
  }

  async createStaff(data: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    const existingStaff = this.staffMembers.filter(s => s.exhibitorId === data.exhibitorId);
    const sequence = existingStaff.length + 1;
    const sequenceStr = sequence.toString().padStart(2, '0');
    
    const newStaff = {
      ...data,
      id: `${data.exhibitorId}-${sequenceStr}`,
      createdAt: new Date()
    };
    this.staffMembers.push(newStaff);
    return newStaff;
  }

  async updateStaff(id: string, data: Partial<Omit<Staff, 'id' | 'createdAt'>>): Promise<Staff> {
    const index = this.staffMembers.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Staff not found');
    this.staffMembers[index] = { ...this.staffMembers[index], ...data };
    return this.staffMembers[index];
  }

  async deleteStaff(id: string): Promise<void> {
    this.staffMembers = this.staffMembers.filter(s => s.id !== id);
  }

  // --- Settings ---
  async getSettings(): Promise<SystemSettings> {
    return this.settings;
  }

  async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
    this.settings = { ...this.settings, ...data };
    return this.settings;
  }

  // --- Invitation Codes ---
  async getInvitationCodes(): Promise<InvitationCode[]> {
    return this.invitationCodes;
  }

  async createInvitationCode(data: Omit<InvitationCode, 'id' | 'createdAt' | 'isUsed'>): Promise<InvitationCode> {
    const newCode = {
      ...data,
      id: uuidv4(),
      isUsed: false,
      createdAt: new Date()
    };
    this.invitationCodes.push(newCode);
    return newCode;
  }

  async updateInvitationCode(id: string, data: Partial<Omit<InvitationCode, 'id' | 'createdAt'>>): Promise<InvitationCode> {
    const index = this.invitationCodes.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Invitation code not found');
    this.invitationCodes[index] = { ...this.invitationCodes[index], ...data };
    return this.invitationCodes[index];
  }

  async deleteInvitationCode(id: string): Promise<void> {
    this.invitationCodes = this.invitationCodes.filter(c => c.id !== id);
  }
}

// Singleton export
export const mockService = new MockService();
