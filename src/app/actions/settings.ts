'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid: string) {
  return requireServerAuthHeaders({ projectUuid })
}

// ==================== TYPES ====================

export interface Room {
  room_uuid: string
  event_uuid: string
  event_name?: string
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  device_id?: string
  room_type?: string
}

export interface Event {
  event_uuid: string
  event_code: string
  event_name: string
  event_color_code?: string | null
  event_logo_url?: string | null
  event_registration_confirmed_message_html?: string | null
  is_active: boolean
  order_index: number
}

interface EventPayload {
  event_name: string
  event_color_code?: string
  event_logo_url?: string
  event_registration_confirmed_message_html?: string
  is_active: boolean
  order_index: number
}

export interface Invitation {
  invite_uuid: string
  event_uuid?: string
  event_name?: string
  company_name: string
  invite_code: string
  invite_link: string
  is_active: boolean
  used_count?: number
  source?: string
  creator_name?: string
}

// ==================== ROOMS ====================

export async function getRooms(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/rooms', { headers })
    const result = response.data
    return { success: true, rooms: (result.data || []) as Room[] }
  } catch (error: any) {
    console.error('Error fetching rooms:', error)
    return { success: false, error: 'Failed to fetch rooms', rooms: [] as Room[] }
  }
}

export async function createRoom(projectUuid: string, data: {
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  device_id?: string
  room_type?: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/rooms', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating room:', error)
    const errMsg = error.response?.data?.message || 'Failed to create room'
    return { success: false, error: errMsg }
  }
}

export async function updateRoom(projectUuid: string, data: {
  room_uuid: string
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  device_id?: string
  room_type?: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/rooms', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating room:', error)
    const errMsg = error.response?.data?.message || 'Failed to update room'
    return { success: false, error: errMsg }
  }
}

// ==================== EVENTS ====================

export async function getEvents(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/events', { headers })
    const result = response.data
    return { success: true, events: (result.data || []) as Event[] }
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return { success: false, error: 'Failed to fetch events', events: [] as Event[] }
  }
}

export async function createEvent(projectUuid: string, data: EventPayload) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/events', data, { headers })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating event:', error)
    const errMsg = error.response?.data?.message || 'Failed to create event'
    return { success: false, error: errMsg }
  }
}

export async function updateEvent(projectUuid: string, data: EventPayload & { event_uuid: string }) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/events', data, { headers })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/events')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating event:', error)
    const errMsg = error.response?.data?.message || 'Failed to update event'
    return { success: false, error: errMsg }
  }
}

// ==================== INVITATIONS ====================

export async function getInvitations(projectUuid: string, eventUuid?: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/invitations', {
      headers,
      ...(eventUuid ? { params: { event_uuid: eventUuid } } : {}),
    })
    const result = response.data
    return { success: true, invitations: (result.data || []) as Invitation[] }
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return { success: false, error: 'Failed to fetch invitations', invitations: [] as Invitation[] }
  }
}

export async function exportInvitations(projectUuid: string, eventUuid?: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/invitations/export-excel', {
      headers,
      ...(eventUuid ? { params: { event_uuid: eventUuid } } : {}),
      responseType: 'arraybuffer',
    })

    return {
      success: true,
      data: new Uint8Array(response.data),
      contentType: response.headers['content-type'],
    }
  } catch (error: unknown) {
    console.error('Error exporting invitations:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function createInvitation(projectUuid: string, data: {
  company_name: string
  event_uuid: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/invitations', data, { headers })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/invitation-codes')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    const errMsg = error.response?.data?.message || 'Failed to create invitation'
    return { success: false, error: errMsg }
  }
}

export async function updateInvitation(projectUuid: string, data: {
  invite_uuid: string
  event_uuid: string
  company_name: string
  invite_code: string
  is_active: boolean
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/invitations', data, { headers })
    revalidatePath('/admin/settings')
    revalidatePath('/admin/invitation-codes')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating invitation:', error)
    const errMsg = error.response?.data?.message || 'Failed to update invitation'
    return { success: false, error: errMsg }
  }
}


