import { v4 as uuidv4 } from 'uuid';

// Types (mirrors functionality of Prisma models)
export interface User {
  id: string;
  username: string;
  password: string; // Plain text or hashed, but we'll mock login check
  role: 'ADMIN' | 'ORGANIZER';
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
  id: string;
  exhibitorId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: Date;
}

export interface SystemSettings {
  siteUrl: string;
  eventDate: Date;
  cutoffDate: Date;
  eventTitle: string;
  eventSubtitle: string;
}

// Mock Data Store
class MockService {
  private readonly users: User[] = [
    { id: '1', username: 'admin', password: 'password', role: 'ADMIN' },
  ];
  
  private readonly projectsList: Project[] = [
    { id: 'ildex-vietnam-2026', name: 'ILDEX VIETNAM 2026', description: 'International Livestock, Dairy, Meat Processing and Aquaculture Exposition', createdAt: new Date() },
    { id: 'horti-agri', name: 'Horti Agri Next', description: 'Horticultural & Agricultural Technologies', createdAt: new Date() },
    { id: 'viv-asia-2027', name: 'VIV Asia 2027', description: 'International Trade Show from Feed to Food', createdAt: new Date() }
  ];

  private settings: SystemSettings = {
    siteUrl: 'https://www.ildexandhortiagri-vietnam.com',
    eventDate: new Date('2024-05-29'),
    cutoffDate: new Date('2024-05-20'),
    eventTitle: 'ILDEX Vietnam 2024',
    eventSubtitle: 'International Livestock, Dairy, Meat Processing and Aquaculture Exposition'
  };

  private organizers: Organizer[] = [];
  private participants: Participant[] = [];
  private conferences: Conference[] = [];
  private exhibitors: Exhibitor[] = [];
  private staffMembers: Staff[] = [];

  // --- Auth & Users ---
  async findUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
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

  async createStaff(data: Omit<Staff, 'id' | 'createdAt'>): Promise<Staff> {
    const newStaff = {
      ...data,
      id: uuidv4(),
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
}

// Singleton export
export const mockService = new MockService();
