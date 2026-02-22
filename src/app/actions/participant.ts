'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export interface Participant {
  registration_uuid: string
  registration_code: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  job_position: string
  attendee_type_code: string
  registered_at: string
  is_active: boolean
  conference_count: number
  is_email_sent: boolean
}

export interface ParticipantDetail extends Participant {
  project_uuid: string
  event_uuid: string
  group_leader_uuid: string
  group_size: number
  title: string
  title_other: string
  company_address: string
  company_city: string
  company_country: string
  nationality: string
  residence_country: string
  mobile_country_code: string
  mobile_number: string
  consent_marketing: boolean
  consent_pdpa: boolean
  invitation_code: string
  exhibitor_uuid: string
  email_sent_at: string
  company_tel: string
}

export async function getParticipants(projectId: string, query?: string, type?: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value || projectId

    const response = await api.get('/v1/admin/project/participants', {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    let participants = response.data.data as Participant[]

    // Client-side filtering for query and type
    if (query) {
      const lowerQuery = query.toLowerCase()
      participants = participants.filter(p => 
        p.first_name.toLowerCase().includes(lowerQuery) ||
        p.last_name.toLowerCase().includes(lowerQuery) ||
        p.email.toLowerCase().includes(lowerQuery) ||
        p.company_name.toLowerCase().includes(lowerQuery) ||
        p.registration_code.toLowerCase().includes(lowerQuery)
      )
    }

    if (type && type !== 'ALL') {
      participants = participants.filter(p => p.attendee_type_code === type)
    }

    return { success: true, data: participants }
  } catch (error: unknown) {
    console.error('Error fetching participants:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch participants'
    return { error: errorMessage }
  }
}

export async function getParticipantById(id: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    const response = await api.get(`/v1/admin/project/participants/${id}`, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    return { success: true, data: response.data.data as ParticipantDetail }
  } catch (error: unknown) {
    console.error('Error fetching participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch participant'
    return { error: errorMessage }
  }
}

export async function createParticipant(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value
    const eventUuid = formData.get('event_uuid') as string

    const body = {
      event_uuid: eventUuid,
      title: formData.get('title') as string,
      title_other: formData.get('title_other') as string || '',
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company_name: formData.get('company_name') as string,
      job_position: formData.get('job_position') as string,
      residence_country: formData.get('residence_country') as string,
      mobile_country_code: formData.get('mobile_country_code') as string,
      mobile_number: formData.get('mobile_number') as string,
      email: formData.get('email') as string,
      invitation_Code: formData.get('invitation_code') as string || '',
      attendee_type_code: formData.get('attendee_type_code') as string
    }

    await api.post('/v1/admin/project/participants', body, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error creating participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create participant'
    return { error: errorMessage }
  }
}

export async function updateParticipant(registrationUuid: string, formData: FormData) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    const body = {
      registration_uuid: registrationUuid,
      title: formData.get('title') as string,
      title_other: formData.get('title_other') as string || '',
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company_name: formData.get('company_name') as string,
      job_position: formData.get('job_position') as string,
      residence_country: formData.get('residence_country') as string,
      mobile_country_code: formData.get('mobile_country_code') as string,
      mobile_number: formData.get('mobile_number') as string,
      email: formData.get('email') as string
    }

    await api.put('/v1/admin/project/participants', body, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update participant'
    return { error: errorMessage }
  }
}

export async function deleteParticipant(registrationUuid: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    await api.delete(`/v1/admin/project/participants/${registrationUuid}/delete`, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error deleting participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete participant'
    return { error: errorMessage }
  }
}

export async function importParticipants(data: Array<{
  event_uuid: string
  title: string
  title_other?: string
  first_name: string
  last_name: string
  company_name: string
  job_position: string
  residence_country: string
  mobile_country_code: string
  mobile_number: string
  email: string
  invitation_Code?: string
  attendee_type_code: string
}>) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    let successCount = 0
    for (const participant of data) {
      try {
        await api.post('/v1/admin/project/participants', participant, {
          headers: {
            'X-Project-UUID': projectUuid
          }
        })
        successCount++
      } catch (error) {
        console.error('Error importing participant:', error)
      }
    }

    revalidatePath('/admin/participants')
    return { success: true, count: successCount }
  } catch (error: unknown) {
    console.error('Error importing participants:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import participants'
    return { error: errorMessage }
  }
}

export async function processScannerData(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file || !projectId) {
      return { success: false, error: 'File and Project ID are required' }
    }

    const text = await file.text()
    const codes = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0)

    // TODO: Implement scanner data processing with real API
    // This would need a specific endpoint for bulk attendance updates
    
    revalidatePath('/admin/participants')
    return { success: true, processed: codes.length, updated: 0 }
  } catch (error: unknown) {
    console.error('Scanner import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process scanner data'
    return { success: false, error: errorMessage }
  }
}

export async function searchParticipantByCode(code: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    const response = await api.get('/v1/admin/project/participants', {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    const participants = response.data.data as Participant[]
    const participant = participants.find(p => p.registration_code === code)

    return { success: true, data: participant }
  } catch (error: unknown) {
    console.error('Error searching participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to search participant'
    return { error: errorMessage }
  }
}

export async function getRecentScannerImports() {
  try {
    // TODO: Implement with real API if available
    return { success: true, data: [] }
  } catch (error: unknown) {
    console.error('Error fetching import history:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch import history'
    return { error: errorMessage }
  }
}

export async function resendEmailConfirmation(registrationUuids: string[]) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    await api.post('/v1/admin/project/participants/send_email_comfirmation', registrationUuids, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    return { success: true }
  } catch (error: unknown) {
    console.error('Error resending email confirmation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to resend email confirmation'
    return { error: errorMessage }
  }
}

export async function getMyReservations(registrationUuid: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    const response = await api.get(`/v1/admin/project/participants/${registrationUuid}/my-reservation`, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    console.error('Error fetching reservations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reservations'
    return { error: errorMessage }
  }
}

export async function reserveConference(conferenceUuid: string, registrationUuid: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    await api.post('/v1/admin/project/participants/reserve', {
      conference_uuid: conferenceUuid,
      registration_uuid: registrationUuid
    }, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    revalidatePath('/admin/participants')
    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error reserving conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reserve conference'
    return { error: errorMessage }
  }
}

export async function cancelConferenceReservation(conferenceUuid: string, registrationUuid: string) {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    await api.post('/v1/admin/project/participants/cancel_reserve', {
      conference_uuid: conferenceUuid,
      registration_uuid: registrationUuid
    }, {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    revalidatePath('/admin/participants')
    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error cancelling conference reservation:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel conference reservation'
    return { error: errorMessage }
  }
}

export interface AttendeeType {
  type_code: string
  type_name: string
  prefix_code: string
  need_questionnaire: boolean
  can_book_conference: boolean
  created_at: string
}

export async function getAllAttendeeTypes() {
  try {
    const cookieStore = await cookies()
    const projectUuid = cookieStore.get('project_uuid')?.value

    const response = await api.get('/v1/admin/project/participants/attendee_types', {
      headers: {
        'X-Project-UUID': projectUuid
      }
    })

    return { success: true, data: response.data.data as AttendeeType[] }
  } catch (error: unknown) {
    console.error('Error fetching attendee types:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendee types'
    return { error: errorMessage }
  }
}
