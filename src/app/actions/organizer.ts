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

export interface Organizer {
  organizer_uuid: string
  username: string
  full_name: string
  project_uuid: string
  project_name: string
  is_active: boolean
  last_login: string
  created_at: string
}

// GET /v1/admin/project/organizers
export async function getOrganizers(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/organizers', {
      headers,
      params: { project_uuid: projectUuid },
    })
    const result = response.data
    return { success: true, data: (result.data || []) as Organizer[] }
  } catch (error: any) {
    console.error('Error fetching organizers:', error)
    return { success: false, error: 'Failed to fetch organizers', data: [] as Organizer[] }
  }
}

// POST /v1/admin/project/organizers
export async function createOrganizer(projectUuid: string, data: {
  username: string
  password: string
  full_name: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/organizers', {
      project_uuid: projectUuid,
      ...data,
    }, { headers })
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error: any) {
    console.error('Error creating organizer:', error)
    const errMsg = error.response?.data?.message || 'Failed to create organizer'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/organizers
export async function updateOrganizer(projectUuid: string, data: {
  organizer_uuid: string
  full_name: string
  is_active: boolean
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put('/v1/admin/project/organizers', data, { headers })
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating organizer:', error)
    const errMsg = error.response?.data?.message || 'Failed to update organizer'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/admin/project/organizers/force_reset_password
export async function forceResetPassword(projectUuid: string, data: {
  organizer_uuid: string
  new_password: string
}) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch('/v1/admin/project/organizers/force_reset_password', data, { headers })
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error: any) {
    console.error('Error resetting password:', error)
    const errMsg = error.response?.data?.message || 'Failed to reset password'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/admin/project/organizers/toggle_status
export async function toggleOrganizerStatus(projectUuid: string, organizerUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch('/v1/admin/project/organizers/toggle_status', {
      organizer_uuid: organizerUuid,
    }, { headers })
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling organizer status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}
