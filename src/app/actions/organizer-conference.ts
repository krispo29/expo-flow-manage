'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Re-export shared interfaces
export type { Conference, ConferenceLog, ShowDate, Room } from './conference'
import type { ShowDate, Room } from './conference'

// Helper function to get headers with auth (includes X-Project-UUID from cookie)
async function getOrganizerAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value
  
  return {
    projectUuid,
    headers: {
      ...(projectUuid && { 'X-Project-UUID': projectUuid }),
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }
}

function parseSpeakers(raw: string | null): { speaker_name: string; speaker_info?: string; speaker_image?: string }[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map(s => ({
        speaker_name: s.speaker_name,
        speaker_info: s.speaker_info || undefined,
        speaker_image: s.speaker_image || undefined
      }))
    }
  } catch (e) {
    console.warn('Failed to parse speakers JSON:', e)
  }
  return []
}

function parseIsActive(raw: FormDataEntryValue | null): boolean {
  if (typeof raw !== 'string') return true
  return raw === 'true' || raw === '1' || raw.toLowerCase() === 'on'
}

// GET /v1/organizer/conferences/
export async function getOrganizerConferences() {
  try {
    const { headers, projectUuid } = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/conferences', { 
      headers,
      params: { project_uuid: projectUuid }
    })

    return { success: true, data: response.data.data as import('./conference').Conference[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer conferences:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conferences'
    return { error: errorMessage }
  }
}

// GET /v1/organizer/conferences/:id
export async function getOrganizerConferenceById(id: string) {
  try {
    const { headers } = await getOrganizerAuthHeaders()
    const response = await api.get(`/v1/organizer/conferences/${id}`, { headers })

    return { success: true, conference: response.data.data as import('./conference').Conference }
  } catch (error: unknown) {
    console.error('Error fetching organizer conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference'
    return { error: errorMessage }
  }
}

// GET /v1/organizer/conferences/:id/logs
export async function getOrganizerConferenceLogs(conferenceUuid: string) {
  try {
    const { headers } = await getOrganizerAuthHeaders()
    const response = await api.get(`/v1/organizer/conferences/${conferenceUuid}/logs`, { headers })

    const data = response.data?.data || []
    return { success: true, data: data as import('./conference').ConferenceLog[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer conference logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference logs'
    return { error: errorMessage }
  }
}

// GET show dates for organizer
export async function getOrganizerProjectShowDates() {
  try {
    const { headers } = await getOrganizerAuthHeaders()

    try {
      const response = await api.get('/v1/admin/project/detail/show_dates', { headers })
      return { success: true, data: response.data.data as ShowDate[] }
    } catch {
      const response = await api.get('/v1/organizer/project/detail/show_dates', { headers })
      return { success: true, data: response.data.data as ShowDate[] }
    }
  } catch (error: unknown) {
    console.error('Error fetching organizer project show dates:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch show dates'
    return { error: errorMessage }
  }
}

// GET rooms for organizer
export async function getOrganizerRooms() {
  try {
    const { headers } = await getOrganizerAuthHeaders()

    try {
      const response = await api.get('/v1/admin/project/rooms', { headers })
      return { success: true, data: response.data.data as Room[] }
    } catch {
      const response = await api.get('/v1/organizer/project/rooms', { headers })
      return { success: true, data: response.data.data as Room[] }
    }
  } catch (error: unknown) {
    console.error('Error fetching organizer rooms:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms'
    return { error: errorMessage }
  }
}

// GET events for organizer (fallback to organizer endpoint if needed)
export async function getOrganizerEvents() {
  try {
    const { headers } = await getOrganizerAuthHeaders()

    try {
      const response = await api.get('/v1/admin/project/events', { headers })
      return { success: true, data: (response.data.data || []) as Array<{ event_uuid: string; event_code: string; event_name: string; is_active: boolean; order_index: number }> }
    } catch {
      const response = await api.get('/v1/organizer/project/events', { headers })
      return { success: true, data: (response.data.data || []) as Array<{ event_uuid: string; event_code: string; event_name: string; is_active: boolean; order_index: number }> }
    }
  } catch (error: unknown) {
    console.error('Error fetching organizer events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events'
    return { success: false, error: errorMessage, data: [] as Array<{ event_uuid: string; event_code: string; event_name: string; is_active: boolean; order_index: number }> }
  }
}

// POST /v1/organizer/conferences/
export async function createOrganizerConference(formData: FormData) {
  try {
    const { headers, projectUuid } = await getOrganizerAuthHeaders()

    const title = formData.get('title') as string
    const eventUuid = formData.get('event_uuid') as string
    const speakerInfo = formData.get('speaker_info') as string
    const speakersRaw = formData.get('speakers') as string | null
    const speakersParsed = parseSpeakers(speakersRaw)
    const speakerName = (formData.get('speaker_name') as string) || (speakersParsed[0]?.speaker_name || '')
    const imageUrl = formData.get('image_url') as string | null
    const showDate = formData.get('show_date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string
    const isActive = parseIsActive(formData.get('is_active'))

    const body = {
      project_uuid: projectUuid,
      event_uuid: eventUuid,
      title,
      speaker_name: speakerName,
      speaker_info: speakerInfo,
      speakers: speakersParsed,
      image_url: imageUrl || undefined,
      show_date: showDate,
      start_time: startTime,
      end_time: endTime,
      location,
      quota: quota ? Number.parseInt(quota, 10) : 0,
      conference_type: conferenceType,
      is_active: isActive,
    }

    console.log('====== CREATE ORGANIZER CONFERENCE PAYLOAD ======', JSON.stringify(body, null, 2))
    await api.post('/v1/organizer/conferences', body, { headers })

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error creating organizer conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create conference'
    return { error: errorMessage }
  }
}

// PUT /v1/organizer/conferences/
export async function updateOrganizerConference(conferenceUuid: string, formData: FormData) {
  try {
    const { headers, projectUuid } = await getOrganizerAuthHeaders()

    const title = formData.get('title') as string
    const eventUuid = formData.get('event_uuid') as string
    const speakerInfo = formData.get('speaker_info') as string
    const speakersRaw = formData.get('speakers') as string | null
    const speakersParsed = parseSpeakers(speakersRaw)
    const speakerName = (formData.get('speaker_name') as string) || (speakersParsed[0]?.speaker_name || '')
    const imageUrl = formData.get('image_url') as string | null
    const showDate = formData.get('show_date') as string
    const startTime = formData.get('start_time') as string
    const endTime = formData.get('end_time') as string
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string
    const isActive = parseIsActive(formData.get('is_active'))

    const body = {
      project_uuid: projectUuid,
      conference_uuid: conferenceUuid,
      event_uuid: eventUuid,
      title,
      speaker_name: speakerName,
      speaker_info: speakerInfo,
      speakers: speakersParsed,
      image_url: imageUrl || undefined,
      show_date: showDate,
      start_time: startTime,
      end_time: endTime,
      location,
      quota: quota ? Number.parseInt(quota, 10) : 0,
      conference_type: conferenceType,
      is_active: isActive,
    }

    console.log('====== UPDATE ORGANIZER CONFERENCE PAYLOAD ======', JSON.stringify(body, null, 2))
    await api.put(`/v1/organizer/conferences/${conferenceUuid}`, body, { headers })

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating organizer conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update conference'
    return { error: errorMessage }
  }
}

export async function toggleOrganizerConferenceActive(conferenceUuid: string, isActive: boolean) {
  try {
    const { headers, projectUuid } = await getOrganizerAuthHeaders()

    await api.patch(
      `/v1/organizer/conferences/${conferenceUuid}/toggle-active`,
      { 
        project_uuid: projectUuid,
        is_active: isActive 
      },
      { headers },
    )

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error toggling organizer conference active:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to toggle conference active status'
    return { success: false, error: errorMessage }
  }
}

