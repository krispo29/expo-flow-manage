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
    ...(projectUuid && { 'X-Project-UUID': projectUuid }),
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// GET /v1/organizer/conferences/
export async function getOrganizerConferences() {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/conferences/', { headers })

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
    const headers = await getOrganizerAuthHeaders()
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
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get(`/v1/organizer/conferences/${conferenceUuid}/logs`, { headers })

    const data = response.data?.data || []
    return { success: true, data: data as import('./conference').ConferenceLog[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer conference logs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference logs'
    return { error: errorMessage }
  }
}

// GET show dates for organizer (reuses admin endpoint with organizer token)
export async function getOrganizerProjectShowDates() {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/project/show_dates', { headers })
    return { success: true, data: response.data.data as ShowDate[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer project show dates:', error)
    // Fallback: try admin endpoint
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch show dates'
    return { error: errorMessage }
  }
}

// GET rooms for organizer (reuses admin endpoint with organizer token)
export async function getOrganizerRooms() {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/project/rooms', { headers })
    return { success: true, data: response.data.data as Room[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer rooms:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch rooms'
    return { error: errorMessage }
  }
}

// POST /v1/organizer/conferences/
export async function createOrganizerConference(formData: FormData) {
  try {
    const headers = await getOrganizerAuthHeaders()

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

    await api.post('/v1/organizer/conferences/', body, { headers })

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
    const headers = await getOrganizerAuthHeaders()

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

    await api.put('/v1/organizer/conferences/', body, { headers })

    revalidatePath('/organizer/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error updating organizer conference:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update conference'
    return { error: errorMessage }
  }
}
