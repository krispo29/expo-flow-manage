import type { BadgeRenderData } from './schema'
export const sampleBadge: BadgeRenderData = {
  fullName: 'Alex Mercer',
  position: 'Product Architect',
  company: 'Acme Corporation',
  country: 'United States',
  registrationCode: 'EXPO-123456',
  badgeType: 'VISITOR',
}

export const thaiSampleBadge: BadgeRenderData = {
  fullName: 'ดร. กฤษฎา สุวรรณรัตนโชติ',
  position: 'ผู้อำนวยการฝ่ายวิจัยและพัฒนานวัตกรรม',
  company: 'บริษัท เจริญโภคภัณฑ์เทคโนโลยี จำกัด (มหาชน)',
  country: 'THAILAND',
  registrationCode: 'EXPO-TH-9021',
  badgeType: 'DELEGATE',
}

export const executiveSampleBadge: BadgeRenderData = {
  fullName: 'Prof. Bartholomew Montgomery-Smith III',
  position: 'Chief Executive Officer & Senior Managing Partner',
  company: 'International Consortium of Biomolecular Engineering',
  country: 'UNITED KINGDOM',
  registrationCode: 'EXPO-VIP-0042',
  badgeType: 'SPEAKER',
}

export const vipSampleBadge: BadgeRenderData = {
  fullName: 'Sarah Chen',
  position: 'Keynote Speaker & Exhibitor',
  company: 'Global Robotics Labs',
  country: 'SINGAPORE',
  registrationCode: 'EXPO-VIP-7788',
  badgeType: 'VIP',
}


export type SamplePersonaKey = 'standard' | 'thai' | 'executive' | 'vip'

export const samplePersonas: Record<SamplePersonaKey, { label: string; data: BadgeRenderData }> = {
  standard: {
    label: 'Standard Attendee',
    data: sampleBadge,
  },
  thai: {
    label: 'Thai Complex Script',
    data: thaiSampleBadge,
  },
  executive: {
    label: 'Multi-line Executive',
    data: executiveSampleBadge,
  },
  vip: {
    label: 'VIP / Exhibitor',
    data: vipSampleBadge,
  },
}

