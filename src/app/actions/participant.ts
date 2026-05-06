'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { requireProjectContext } from '@/lib/authorization'
import { getUserRole } from '@/app/actions/auth'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export async function printParticipantBadge(projectId: string, registrationUuid: string) {
  try {
    const headers = await getAuthHeaders(projectId)
    await api.post(`/v1/admin/project/participants/${registrationUuid}/print`, {}, {
      headers
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error printing participant badge:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to print participant badge'
    return { success: false, error: errorMessage }
  }
}

export async function printParticipantBadgesBulk(projectId: string, registrationCodes: string[]) {
  try {
    const headers = await getAuthHeaders(projectId)
    await api.post('/v1/admin/project/participants/print-bulk', {
      registration_codes: registrationCodes
    }, {
      headers
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error printing bulk participant badges:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to print bulk participant badges'
    return { success: false, error: errorMessage }
  }
}


// Helper function to get headers with auth
async function getAuthHeaders(projectUuid?: string) {
  return requireServerAuthHeaders({ projectUuid })
}

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
  title?: string
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
  // Verify user has access to this project
  await requireProjectContext(projectId)
  
  try {
    const headers = await getAuthHeaders(projectId)
 
    const role = await getUserRole()
    const basePath = role === 'ORGANIZER' 
      ? '/v1/organizer/participants' 
      : '/v1/admin/project/participants'

    const response = await api.get(basePath, { headers })

    let participants = (response.data.data as Participant[]) || []

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
    const authContext = await getServerAuthContext()
    const projectUuid = authContext?.projectUuid
    
    // Verify user has access to this project
    if (projectUuid) {
      await requireProjectContext(projectUuid)
    }
    
    const headers = await getAuthHeaders()
 
    const response = await api.get(`/v1/admin/project/participants/${id}`, {
      headers
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
      invitation_code: formData.get('invitation_code') as string || '',
      attendee_type_code: formData.get('attendee_type_code') as string
    }

    const headers = await getAuthHeaders()
 
    await api.post('/v1/admin/project/participants', body, {
      headers
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
      email: formData.get('email') as string,
      attendee_type_code: formData.get('attendee_type_code') as string
    }

    const headers = await getAuthHeaders()
 
    const role = await getUserRole()
    const basePath = role === 'ORGANIZER' 
      ? '/v1/organizer/participants' 
      : '/v1/admin/project/participants'

    await api.put(basePath, body, {
      headers
    })

    revalidatePath('/admin/participants')
    revalidatePath('/organizer/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating participant:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update participant'
    return { error: errorMessage }
  }
}

export async function deleteParticipant(registrationUuid: string) {
  try {
    const authContext = await getServerAuthContext()
    const projectUuid = authContext?.projectUuid
    
    // Verify user has access to this project before deletion
    if (!projectUuid) {
      return { error: 'Project context required' }
    }
    await requireProjectContext(projectUuid)
    
    const headers = await getAuthHeaders()
 
    await api.delete(`/v1/admin/project/participants/${registrationUuid}/delete`, {
      headers
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
  invitation_code?: string
  attendee_type_code: string
}>) {
  try {
    const headers = await getAuthHeaders()
 
    let successCount = 0
    for (const participant of data) {
      try {
        await api.post('/v1/admin/project/participants', participant, {
          headers
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

export async function searchParticipantsByCodes(projectId: string, codes: string[]) {
  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.get('/v1/admin/project/participants', {
      headers
    })

    const participants = response.data.data as Participant[]
    const participantsByCode = new Map(
      participants
        .filter(p => p.registration_code)
        .map(p => [p.registration_code.toLowerCase(), p])
    )
    const seenCodes = new Set<string>()
    const foundParticipants = codes
      .map(code => code.trim().toLowerCase())
      .filter(code => {
        if (!code || seenCodes.has(code)) return false
        seenCodes.add(code)
        return true
      })
      .map(code => participantsByCode.get(code))
      .filter((participant): participant is Participant => Boolean(participant))

    return { success: true, data: foundParticipants }
  } catch (error: unknown) {
    console.error('Error searching participants:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to search participants'
    return { error: errorMessage }
  }
}

export async function searchParticipantByCode(code: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/participants', {
      headers
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

export async function resendEmailConfirmation(data: { registration_uuid: string, email?: string }[]) {
  try {
    const headers = await getAuthHeaders()
    await api.post('/v1/admin/project/participants/resend_email_comfirmation', data, {
      headers
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
    const headers = await getAuthHeaders()
    const response = await api.get(`/v1/admin/project/participants/${registrationUuid}/my-reservation`, {
      headers
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
    const headers = await getAuthHeaders()
    
    const role = await getUserRole()
    const basePath = role === 'ORGANIZER' 
      ? '/v1/organizer/participants/reserve' 
      : '/v1/admin/project/participants/reserve'

    await api.post(basePath, {
      conference_uuid: conferenceUuid,
      registration_uuid: registrationUuid
    }, {
      headers
    })

    revalidatePath('/admin/participants')
    revalidatePath('/admin/conferences')
    revalidatePath('/organizer/participants')
    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error reserving conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reserve conference'
    return { error: errorMessage }
  }
}

export async function cancelConferenceReservation(conferenceUuid: string, registrationUuid: string) {
  try {
    const headers = await getAuthHeaders()
    
    const role = await getUserRole()
    const basePath = role === 'ORGANIZER' 
      ? '/v1/organizer/participants/cancel_reserve' 
      : '/v1/admin/project/participants/cancel_reserve'
      
    await api.post(basePath, {
      conference_uuid: conferenceUuid,
      registration_uuid: registrationUuid
    }, {
      headers
    })

    revalidatePath('/admin/participants')
    revalidatePath('/admin/conferences')
    revalidatePath('/organizer/participants')
    revalidatePath('/organizer/conferences')
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
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/participants/attendee_types', {
      headers
    })

    return { success: true, data: response.data.data as AttendeeType[] }
  } catch (error: unknown) {
    console.error('Error fetching attendee types:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendee types'
    return { error: errorMessage }
  }
}

export type AttendanceLog = {
  log_id: number
  registration_code: string
  device_id: string
  scanned_at: string
  first_name: string
  last_name: string
  company_name: string
  job_position: string
  room_name: string
}

export async function getAttendanceLogs(page: number = 1, limit: number = 50, keyword: string = '') {
  try {
    const headers = await getAuthHeaders()
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (keyword) {
      params.append('keyword', keyword)
    }

    const response = await api.get(`/v1/admin/project/participants/attendance_logs?${params.toString()}`, {
      headers
    })

    const data = response.data.data
    return { success: true, total: data.total as number, items: data.items as AttendanceLog[] }
  } catch (error: unknown) {
    console.error('Error fetching attendance logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch attendance logs'
    return { success: false, error: errorMessage, total: 0, items: [] }
  }
}

export async function importAttendanceLogs(formData: FormData) {
  try {
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string

    if (!file) {
      return { success: false, error: 'File is required' }
    }

    // Verify user has access to this project
    if (projectId) {
      await requireProjectContext(projectId)
    }

    const headers = await getAuthHeaders(projectId)
    
    await api.post('/v1/admin/project/participants/attendance_logs/import', formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data'
      }
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Attendance Log import error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import attendance logs'
    return { success: false, error: errorMessage }
  }
}

export async function getPrintLogs(page: number = 1, limit: number = 50, keyword: string = '') {
  try {
    const headers = await getAuthHeaders()
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (keyword) {
      params.append('keyword', keyword)
    }

    const response = await api.get(`/v1/admin/project/participants/print-logs?${params.toString()}`, {
      headers
    })

    const data = response.data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: true, total: data.total as number, items: data.items as any[] }
  } catch (error: unknown) {
    console.error('Error fetching print logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch print logs'
    return { success: false, error: errorMessage, total: 0, items: [] }
  }
}

export async function getPrintedNoAttendance(page: number = 1, limit: number = 50, keyword: string = '') {
  try {
    const headers = await getAuthHeaders()
    
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    if (keyword) {
      params.append('keyword', keyword)
    }

    const response = await api.get(`/v1/admin/project/participants/printed_no_attendance?${params.toString()}`, {
      headers
    })

    const data = response.data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { success: true, total: data.total as number, items: data.items as any[] }
  } catch (error: unknown) {
    console.error('Error fetching printed no attendance:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch printed no attendance'
    return { success: false, error: errorMessage, total: 0, items: [] }
  }
}

export async function generateAttendanceLogs(data: {
  registration_codes: string[]
  room_uuid: string
  date: string
  start_time: string
  end_time: string
}) {
  try {
    const headers = await getAuthHeaders()
    
    await api.post('/v1/admin/project/participants/attendance_logs/generate', data, {
      headers
    })
    
    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error generating attendance logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate attendance logs'
    return { success: false, error: errorMessage }
  }
}

