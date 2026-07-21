import type { AttendeeType } from '@/app/actions/participant'
import type { UpgradeRequest, UpgradeRequestStatus } from '@/app/actions/upgrade-request'

export type UpgradeRequestFilter = UpgradeRequestStatus | 'all'

export interface ReviewUpgradeRequestPayload {
  request_uuid: string
  approve: boolean
  target_type_code?: string
  note?: string
}

export function normalizeUpgradeStatus(status?: string): UpgradeRequestStatus {
  if (status === 'approved' || status === 'rejected') return status
  return 'pending'
}

export function getAttendeeTypeName(
  code: string | null | undefined,
  attendeeTypes: AttendeeType[]
) {
  const normalizedCode = code?.trim().toUpperCase()
  if (!normalizedCode) return 'Unknown'

  const attendeeType = attendeeTypes.find(
    (item) => item.type_code.trim().toUpperCase() === normalizedCode
  )

  return attendeeType?.type_name || attendeeType?.badge_name || normalizedCode
}

export function getDefaultTargetTypeCode(
  request: Pick<UpgradeRequest, 'suggested_type_code' | 'approved_type_code'>
) {
  return request.suggested_type_code || request.approved_type_code || ''
}

export function filterUpgradeRequests(
  requests: UpgradeRequest[],
  status: UpgradeRequestFilter,
  searchQuery: string
) {
  const query = searchQuery.trim().toLowerCase()
  const requestKeys = new Set<string>()

  return requests.filter((request) => {
    const matchesStatus =
      status === 'all' || normalizeUpgradeStatus(request.status) === status

    if (!matchesStatus) return false

    const requestKey = `${request.registration_uuid}:${request.suggested_type_code}`
    if (requestKeys.has(requestKey)) return false
    requestKeys.add(requestKey)
    if (!query) return true

    return [
      request.first_name,
      request.last_name,
      request.email,
      request.company_name,
      request.registration_code,
      request.question_text,
      request.option_label,
    ].some((value) => value?.toLowerCase().includes(query))
  })
}

export function buildReviewUpgradePayload(input: {
  requestUuid: string
  approve: boolean
  targetTypeCode?: string
  note?: string
}): ReviewUpgradeRequestPayload {
  const targetTypeCode = input.targetTypeCode?.trim()
  const note = input.note?.trim()

  return {
    request_uuid: input.requestUuid,
    approve: input.approve,
    ...(input.approve && targetTypeCode
      ? { target_type_code: targetTypeCode }
      : {}),
    ...(note ? { note } : {}),
  }
}
