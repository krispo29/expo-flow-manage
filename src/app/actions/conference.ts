'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Helper function to get headers with auth
async function getAuthHeaders() {
  const cookieStore = await cookies()
  const projectUuid = cookieStore.get('project_uuid')?.value
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export interface Conference {
  conference_uuid: string
  project_uuid: string
  title: string
  speaker_name: string
  speaker_info: string
  show_date: string
  start_time: string
  end_time: string
  location: string
  quota: number
  remaining_seats: number
  conference_type: 'public' | 'private'
  reserved_count: number
  status: string
  created_at: string
  can_book: boolean
}

export interface ConferenceLog {
  log_id: number
  conference_uuid: string
  registration_uuid: string
  action: string
  performed_by: string
  details: string
  created_at: string
  attendee_name: string
}

export interface ShowDate {
  label: string
  value: string
}

export interface Room {
  room_uuid: string
  event_uuid: string
  event_name: string
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  scanner_id?: string
}

export async function getConferences(projectId: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/conferences', { headers })

    return { success: true, data: response.data.data as Conference[] }
  } catch (error: unknown) {
    console.error('Error fetching conferences:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conferences'
    return { error: errorMessage }
  }
}

export async function getConferenceById(id: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get(`/v1/admin/project/conferences/${id}`, { headers })

    return { success: true, conference: response.data.data as Conference }
  } catch (error: unknown) {
    console.error('Error fetching conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference'
    return { error: errorMessage }
  }
}

export async function getConferenceLogs(conferenceUuid: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get(`/v1/admin/project/conferences/${conferenceUuid}/logs`, { headers })

    return { success: true, data: response.data.data as ConferenceLog[] }
  } catch (error: unknown) {
    console.error('Error fetching conference logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference logs'
    return { error: errorMessage }
  }
}

export async function getProjectShowDates() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/detail/show_dates', { headers })
    return { success: true, data: response.data.data as ShowDate[] }
  } catch (error: unknown) {
    console.error('Error fetching project show dates:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch show dates'
    return { error: errorMessage }
  }
}

export async function getRooms() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/rooms', { headers })
    return { success: true, data: response.data.data as Room[] }
  } catch (error: unknown) {
    console.error('Error fetching rooms:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms'
    return { error: errorMessage }
  }
}

export async function createConference(formData: FormData) {
  try {
    const headers = await getAuthHeaders()

    const title = formData.get('title') as string
    const speakerName = formData.get('speaker_name') as string
    const speakerInfo = formData.get('speaker_info') as string
    const showDate = formData.get('show_date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string

    const body = {
      title,
      speaker_name: speakerName,
      speaker_info: speakerInfo,
      show_date: showDate,
      start_time: startTime,
      end_time: endTime,
      location,
      quota: quota ? Number.parseInt(quota, 10) : 0,
      conference_type: conferenceType
    }

    await api.post('/v1/admin/project/conferences', body, { headers })

    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error creating conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create conference'
    return { error: errorMessage }
  }
}

export async function updateConference(conferenceUuid: string, formData: FormData) {
  try {
    const headers = await getAuthHeaders()

    const title = formData.get('title') as string
    const speakerName = formData.get('speaker_name') as string
    const speakerInfo = formData.get('speaker_info') as string
    const showDate = formData.get('show_date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string

    const body = {
      conference_uuid: conferenceUuid,
      title,
      speaker_name: speakerName,
      speaker_info: speakerInfo,
      show_date: showDate,
      start_time: startTime,
      end_time: endTime,
      location,
      quota: quota ? Number.parseInt(quota, 10) : 0,
      conference_type: conferenceType
    }

    await api.put('/v1/admin/project/conferences', body, { headers })

    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update conference'
    return { error: errorMessage }
  }
}

export async function importConferences(data: Array<{
  title: string
  speaker_name: string
  speaker_info: string
  show_date: string
  start_time: string
  end_time: string
  location: string
  quota: number
  conference_type: 'public' | 'private'
}>) {
  try {
    const headers = await getAuthHeaders()

    let successCount = 0
    for (const conf of data) {
      try {
        await api.post('/v1/admin/project/conferences', {
          title: conf.title,
          speaker_name: conf.speaker_name,
          speaker_info: conf.speaker_info,
          show_date: conf.show_date,
          start_time: conf.start_time,
          end_time: conf.end_time,
          location: conf.location,
          quota: conf.quota,
          conference_type: conf.conference_type
        }, { headers })
        successCount++
      } catch (error) {
        console.error('Error importing conference:', error)
      }
    }
    
    revalidatePath('/admin/conferences')
    return { success: true, count: successCount }
  } catch (error: unknown) {
    console.error('Error importing conferences:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import conferences'
    return { error: errorMessage }
  }
}
