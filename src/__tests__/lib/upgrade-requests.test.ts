import type { UpgradeRequest } from '@/app/actions/upgrade-request'
import type { AttendeeType } from '@/app/actions/participant'
import {
  buildReviewUpgradePayload,
  filterUpgradeRequests,
  getAttendeeTypeName,
  getDefaultTargetTypeCode,
  normalizeUpgradeStatus,
} from '@/lib/upgrade-requests'

const requests: UpgradeRequest[] = [
  {
    request_uuid: 'request-1',
    project_uuid: 'project-1',
    registration_uuid: 'registration-1',
    trigger_uuid: 'trigger-1',
    question_uuid: 'question-1',
    trigger_option_value: 'laboratory_director_manager',
    from_type_code: 'VI',
    suggested_type_code: 'BY',
    approved_type_code: '',
    status: 'pending',
    reviewed_by: '',
    reviewed_at: '',
    note: '',
    created_at: '2026-06-14T04:48:08Z',
    first_name: 'Surasak',
    last_name: 'Phothiphiphit',
    email: 'person@example.com',
    company_name: 'The Deft',
    registration_code: 'VI131912554',
    question_text: 'What is your job function?',
    option_label: 'Laboratory Director / Manager',
  },
  {
    request_uuid: 'request-2',
    project_uuid: 'project-1',
    registration_uuid: 'registration-2',
    trigger_uuid: 'trigger-2',
    question_uuid: 'question-2',
    trigger_option_value: 'owner',
    from_type_code: 'VI',
    suggested_type_code: 'VP',
    approved_type_code: 'VP',
    status: 'approved',
    reviewed_by: 'admin-1',
    reviewed_at: '2026-06-14T05:11:34Z',
    note: 'Confirmed',
    created_at: '2026-06-14T04:40:08Z',
    first_name: 'Maria',
    last_name: 'Cruz',
    email: 'maria@example.com',
    company_name: 'LabWorks',
    registration_code: 'VP10002',
    question_text: 'What is your role?',
    option_label: 'Owner',
  },
]

const attendeeTypes: AttendeeType[] = [
  {
    type_code: 'VI',
    type_name: 'Visitor',
    prefix_code: 'VI',
    need_questionnaire: true,
    can_book_conference: false,
    created_at: '',
  },
  {
    type_code: 'BY',
    type_name: 'Buyer',
    prefix_code: 'BY',
    need_questionnaire: false,
    can_book_conference: true,
    created_at: '',
  },
]

describe('upgrade request helpers', () => {
  it('normalizes unknown statuses to pending', () => {
    expect(normalizeUpgradeStatus('approved')).toBe('approved')
    expect(normalizeUpgradeStatus('rejected')).toBe('rejected')
    expect(normalizeUpgradeStatus('unexpected')).toBe('pending')
  })

  it('resolves attendee type labels and falls back to the code', () => {
    expect(getAttendeeTypeName('by', attendeeTypes)).toBe('Buyer')
    expect(getAttendeeTypeName('VP', attendeeTypes)).toBe('VP')
  })

  it('defaults approval to the suggested type', () => {
    expect(getDefaultTargetTypeCode(requests[0])).toBe('BY')
  })

  it('filters by status and attendee search fields', () => {
    expect(filterUpgradeRequests(requests, 'pending', '')).toEqual([requests[0]])
    expect(filterUpgradeRequests(requests, 'all', 'labworks')).toEqual([requests[1]])
    expect(filterUpgradeRequests(requests, 'all', 'VI131')).toEqual([requests[0]])
  })

  it('removes duplicate upgrade requests for the same attendee and target type', () => {
    expect(
      filterUpgradeRequests(
        [...requests, { ...requests[0], request_uuid: 'request-duplicate' }],
        'pending',
        ''
      )
    ).toEqual([requests[0]])
  })

  it('builds approve and reject payloads with trimmed optional values', () => {
    expect(
      buildReviewUpgradePayload({
        requestUuid: 'request-1',
        approve: true,
        targetTypeCode: ' BY ',
        note: ' Qualified buyer ',
      })
    ).toEqual({
      request_uuid: 'request-1',
      approve: true,
      target_type_code: 'BY',
      note: 'Qualified buyer',
    })

    expect(
      buildReviewUpgradePayload({
        requestUuid: 'request-1',
        approve: false,
        targetTypeCode: 'BY',
        note: ' ',
      })
    ).toEqual({
      request_uuid: 'request-1',
      approve: false,
    })
  })
})
