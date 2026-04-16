'use server'

import api, { getErrorMessage } from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { requireServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

// Re-export shared interfaces
export type { Conference, ConferenceLog, ShowDate, Room } from './conference'
import type { ShowDate, Room } from './conference'

// Helper function to get headers with auth (includes X-Project-UUID from cookie)
async function getOrganizerAuthHeaders() {
  const authContext = await requireServerAuthContext()

  return {
    projectUuid: authContext.projectUuid,
    headers: await requireServerAuthHeaders(),
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
    return { error: getErrorMessage(error) }
  }
}

export async function exportOrganizerConferenceReservationSummary(projectId?: string) {
  try {
    const { headers } = await getOrganizerAuthHeaders()
    if (projectId) {
      Object.assign(headers, { 'X-Project-UUID': projectId })
    }

    const response = await api.get(
      '/v1/organizer/conferences/export-excel-conference-summary-reservation',
      {
        headers,
        responseType: 'arraybuffer',
      }
    )

    return {
      success: true,
      data: new Uint8Array(response.data),
      contentType: response.headers['content-type'],
    }
  } catch (error: unknown) {
    console.error('Error exporting organizer conference reservation summary:', error)
    return { success: false, error: getErrorMessage(error) }
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
    return { error: getErrorMessage(error) }
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
    return { error: getErrorMessage(error) }
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
    return { error: getErrorMessage(error) }
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
    return { error: getErrorMessage(error) }
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
    return { success: false, error: getErrorMessage(error), data: [] as Array<{ event_uuid: string; event_code: string; event_name: string; is_active: boolean; order_index: number }> }
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
    const startTime = (formData.get('start_time') as string)?.substring(0, 5)
    const endTime = (formData.get('end_time') as string)?.substring(0, 5)
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string
    const chargeType = (formData.get('charge_type') as string) || 'free'
    const isActive = parseIsActive(formData.get('is_active'))
    const detail = formData.get('detail') as string

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
      charge_type: chargeType,
      is_active: isActive,
      detail: detail || undefined,
    }

    console.log('====== CREATE ORGANIZER CONFERENCE PAYLOAD ======', JSON.stringify(body, null, 2))
    await api.post('/v1/organizer/conferences', body, { headers })

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error creating organizer conference:', error)
    return { error: getErrorMessage(error) }
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
    const startTime = (formData.get('start_time') as string)?.substring(0, 5)
    const endTime = (formData.get('end_time') as string)?.substring(0, 5)
    const location = formData.get('location') as string
    const quota = formData.get('quota') as string
    const conferenceType = formData.get('conference_type') as string
    const chargeType = (formData.get('charge_type') as string) || 'free'
    const isActive = parseIsActive(formData.get('is_active'))
    const detail = formData.get('detail') as string

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
      charge_type: chargeType,
      is_active: isActive,
      detail: detail || undefined,
    }

    console.log('====== UPDATE ORGANIZER CONFERENCE PAYLOAD ======', JSON.stringify(body, null, 2))
    await api.put(`/v1/organizer/conferences/${conferenceUuid}`, body, { headers })

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating organizer conference:', error)
    return { error: getErrorMessage(error) }
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
    return { success: false, error: getErrorMessage(error) }
  }
}

