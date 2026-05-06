export const ATTENDEE_TYPE_LABELS = {
  VI: 'Visitor',
  VP: 'VIP',
  EX: 'Exhibitor',
  VG: 'VIP Group',
  BY: 'Buyer',
  SP: 'Speaker',
  PR: 'Press',
  OR: 'Organizer',
  SA: 'Sale Agent',
  ST: 'Onsite staff',
} as const

export function getAttendeeTypeLabel(value?: string | null) {
  const attendeeType = value?.trim()

  if (!attendeeType) {
    return ''
  }

  const normalized = attendeeType.toUpperCase()
  return ATTENDEE_TYPE_LABELS[normalized as keyof typeof ATTENDEE_TYPE_LABELS] || attendeeType
}
