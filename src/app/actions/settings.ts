'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import api from '@/lib/api'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// ==================== TYPES ====================

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

export interface Event {
  event_uuid: string
  event_code: string
  event_name: string
  is_active: boolean
  order_index: number
}

export interface Invitation {
  invite_uuid: string
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
  event_uuid: string
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  scanner_id?: string
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
  event_uuid: string
  room_name: string
  location_detail: string
  capacity: number
  is_active: boolean
  scanner_id?: string
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

export async function createEvent(projectUuid: string, data: {
  event_name: string
  is_active: boolean
  order_index: number
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/events', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating event:', error)
    const errMsg = error.response?.data?.message || 'Failed to create event'
    return { success: false, error: errMsg }
  }
}

export async function updateEvent(projectUuid: string, data: {
  event_uuid: string
  event_name: string
  is_active: boolean
  order_index: number
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/events', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating event:', error)
    const errMsg = error.response?.data?.message || 'Failed to update event'
    return { success: false, error: errMsg }
  }
}

// ==================== INVITATIONS ====================

export async function getInvitations(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/invitations', { headers })
    const result = response.data
    return { success: true, invitations: (result.data || []) as Invitation[] }
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return { success: false, error: 'Failed to fetch invitations', invitations: [] as Invitation[] }
  }
}

export async function createInvitation(projectUuid: string, data: {
  company_name: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/invitations', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    const errMsg = error.response?.data?.message || 'Failed to create invitation'
    return { success: false, error: errMsg }
  }
}

export async function updateInvitation(projectUuid: string, data: {
  invite_uuid: string
  company_name: string
  invite_code: string
  is_active: boolean
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/invitations', data, { headers })
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating invitation:', error)
    const errMsg = error.response?.data?.message || 'Failed to update invitation'
    return { success: false, error: errMsg }
  }
}
