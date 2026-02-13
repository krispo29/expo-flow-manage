export type MemberType = 
  | "Total Visitor"
  | "Preregister"
  | "Group"
  | "Onsite"
  | "Exhibitor"
  | "VIP"
  | "Buyer"
  | "Speaker"
  | "Press"
  | "Organizer"
  | "Staff";

export type BadgeCode = 
  | "VI" | "VO" | "VG" | "VP" | "EX" | "OR" | "ST" | "SP" | "PR" | "BY";

export interface Conference {
  id: string;
  topic: string;
  learnMore?: string; // HTML/Rich text
  speakerInfo?: string; // HTML/Rich text
  photo?: string; // URL
  date: string; // ISO Date
  timeStart: string;
  timeEnd: string;
  room: string;
  limitSeats: number;
  showOnRegPage: boolean;
  publicSession: boolean;
  capacity?: number;
  preRegistration?: boolean;
}

export interface Member {
  id: string;
  name: string;
  email: string; // Unique
  type: MemberType;
  badgeCode: BadgeCode;
  company?: string;
  registeredAt: string;
}

export interface ReportFilter {
  event?: string;
  keyword?: string;
  memberType?: MemberType;
  reportType: "Print Badge" | "Total Visits";
  dateStart?: string;
  dateEnd?: string;
  invitationCode?: string;
  country?: string;
  includeQuestionnaires?: boolean;
}
