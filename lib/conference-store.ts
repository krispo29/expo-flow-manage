import { create } from 'zustand'
import { Conference } from '@/lib/types'

interface ConferenceStore {
  conferences: Conference[];
  addConference: (conf: Omit<Conference, 'id'>) => void;
  updateConference: (id: string, conf: Partial<Conference>) => void;
  deleteConference: (id: string) => void;
  importFromExcel: (data: any[]) => void;
}

// Mock Data
const MOCK_CONFERENCES: Conference[] = [
  {
    id: '1',
    topic: 'Opening Ceremony',
    date: '2024-11-20',
    timeStart: '09:00',
    timeEnd: '10:00',
    room: 'Main Hall',
    limitSeats: 500,
    showOnRegPage: true,
    publicSession: true,
    capacity: 500,
    preRegistration: true,
    photo: '',
  },
  {
    id: '2',
    topic: 'Future of Agri-Tech',
    date: '2024-11-20',
    timeStart: '10:30',
    timeEnd: '12:00',
    room: 'Room A',
    limitSeats: 100,
    showOnRegPage: true,
    publicSession: false,
    capacity: 100,
    preRegistration: true,
    photo: '',
  },
  {
    id: '3',
    topic: 'Sustainable Farming',
    date: '2024-11-21',
    timeStart: '13:00',
    timeEnd: '14:30',
    room: 'Room B',
    limitSeats: 80,
    showOnRegPage: true,
    publicSession: false,
    capacity: 80,
    preRegistration: true,
    photo: '',
  },
];

export const useConferenceStore = create<ConferenceStore>((set) => ({
  conferences: MOCK_CONFERENCES,
  addConference: (conf) => set((state) => ({ 
    conferences: [...state.conferences, { ...conf, id: Math.random().toString(36).substr(2, 9) }] 
  })),
  updateConference: (id, conf) => set((state) => ({
    conferences: state.conferences.map((c) => (c.id === id ? { ...c, ...conf } : c)),
  })),
  deleteConference: (id) => set((state) => ({
    conferences: state.conferences.filter((c) => c.id !== id),
  })),
  importFromExcel: (data) => console.log("Import not implemented", data),
}))
