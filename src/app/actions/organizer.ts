'use server'

import { revalidatePath } from 'next/cache'
import api from '@/lib/api'

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
    const response = await api.get('/v1/admin/project/organizers', {
      headers: { 'X-Project-UUID': projectUuid },
      params: { project_uuid: projectUuid }, // Keep query param if API creates filtered list based on this too, or just to be safe
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
    await api.post('/v1/admin/project/organizers', {
      project_uuid: projectUuid,
      ...data,
    }, {
      headers: { 'X-Project-UUID': projectUuid },
    })
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
    await api.put('/v1/admin/project/organizers', data, {
      headers: { 'X-Project-UUID': projectUuid },
    })
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
    await api.patch('/v1/admin/project/organizers/force_reset_password', data, {
      headers: { 'X-Project-UUID': projectUuid },
    })
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
    await api.patch('/v1/admin/project/organizers/toggle_status', {
      organizer_uuid: organizerUuid,
    }, {
      headers: { 'X-Project-UUID': projectUuid },
    })
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling organizer status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}
