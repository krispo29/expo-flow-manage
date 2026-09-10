import { getAttendeeTypeLabel } from '@/lib/attendee-types'
import {
  findCountryByCodeOrName,
  getCountryDisplayName,
  getCountryNameFromValue,
} from '@/lib/countries'
import type { BadgePreviewParticipant } from '@/app/actions/participant'
import type { BadgeRenderData } from './schema'

export function participantToBadgeRenderData(
  participant: BadgePreviewParticipant,
  projectCode: string
): BadgeRenderData {
  const rawCountry = participant.residence_country || participant.country || ''
  const country = findCountryByCodeOrName(rawCountry)

  return {
    fullName: [participant.first_name, participant.last_name]
      .filter(Boolean)
      .join(' '),
    position: participant.job_position || '',
    company: participant.company_name || '',
    country: country
      ? getCountryDisplayName(country, projectCode)
      : getCountryNameFromValue(rawCountry, ''),
    registrationCode: participant.registration_code || '',
    badgeType: (
      getAttendeeTypeLabel(
        participant.attendee_type_code || participant.attendee_type_name
      ) ||
      participant.attendee_type_code ||
      'VISITOR'
    ).toUpperCase(),
  }
}
