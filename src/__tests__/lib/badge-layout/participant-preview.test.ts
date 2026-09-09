import { participantToBadgeRenderData } from '@/lib/badge-layout/participant-preview'

describe('participantToBadgeRenderData', () => {
  it('normalizes complete attendee data for the badge renderer', () => {
    expect(
      participantToBadgeRenderData(
        {
          registration_uuid: 'p-1',
          registration_code: 'R001',
          first_name: 'John',
          last_name: 'Doe',
          company_name: 'ACME',
          job_position: 'Developer',
          attendee_type_code: 'VIP',
          residence_country: 'TH',
        },
        'PH'
      )
    ).toEqual({
      fullName: 'John Doe',
      position: 'Developer',
      company: 'ACME',
      country: expect.any(String),
      registrationCode: 'R001',
      badgeType: expect.any(String),
    })
  })

  it('keeps complex names and blanks missing optional values', () => {
    expect(
      participantToBadgeRenderData(
        {
          registration_uuid: 'p-2',
          registration_code: '',
          first_name: 'ดร. กฤษฎา',
          last_name: 'สุวรรณรัตนโชติ',
          company_name: '',
          job_position: '',
          attendee_type_code: '',
          country: '',
        },
        'THAILAB2026'
      )
    ).toEqual({
      fullName: 'ดร. กฤษฎา สุวรรณรัตนโชติ',
      position: '',
      company: '',
      country: '',
      registrationCode: '',
      badgeType: 'VISITOR',
    })
  })
})
