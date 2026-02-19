'use server'

import { revalidatePath } from 'next/cache'
import api from '@/lib/api'

export interface Exhibitor {
  id: string
  // Add other properties based on what the UI expects, 
  // or just use generic types if we don't have the full shape yet.
  // Based on old code:
  companyName: string
  registrationId: string
  boothNumber?: string
  zone?: string
  email?: string
  phone?: string
  contactPerson?: string
  inviteCode?: string
  projectId?: string
  password?: string // only if returned
  createdAt?: string
}

// GET /v1/admin/project/exhibitors
export async function getExhibitors(projectUuid: string) {
  try {
    const response = await api.get('/v1/admin/project/exhibitors', {
      headers: { 'X-Project-UUID': projectUuid },
      params: { project_uuid: projectUuid }
    })
    // Adjust based on real API response structure
    const result = response.data
    return { success: true, exhibitors: (result.data || []) as Exhibitor[] }
  } catch (error: any) {
    console.error('Error fetching exhibitors:', error)
    return { success: false, error: 'Failed to fetch exhibitors' }
  }
}

// POST /v1/admin/project/exhibitors
export async function createExhibitor(projectUuid: string, data: any) {
  try {
    const response = await api.post('/v1/admin/project/exhibitors', data, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error creating exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to create exhibitor'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/exhibitors
export async function updateExhibitor(projectUuid: string, data: any) {
  try {
    const response = await api.put('/v1/admin/project/exhibitors', data, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error updating exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to update exhibitor'
    return { success: false, error: errMsg }
  }
}

// DELETE /v1/admin/project/exhibitors
export async function deleteExhibitor(projectUuid: string, exhibitorId: string) {
  try {
    // Assuming DELETE uses query param or body
    await api.delete('/v1/admin/project/exhibitors', {
      headers: { 'X-Project-UUID': projectUuid },
      data: { exhibitor_uuid: exhibitorId }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting exhibitor:', error)
    return { success: false, error: 'Failed to delete exhibitor' }
  }
}

// GET /v1/admin/project/exhibitors/detail
export async function getExhibitorById(projectUuid: string, exhibitorId: string) {
  try {
    const response = await api.get('/v1/admin/project/exhibitors/detail', {
      headers: { 'X-Project-UUID': projectUuid },
      params: { exhibitor_uuid: exhibitorId }
    })
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error fetching exhibitor:', error)
    return { success: false, error: 'Failed to fetch exhibitor' }
  }
}

// Custom action for generating invite code
export async function generateInviteCode(projectUuid: string, exhibitorId: string) {
  try {
    const response = await api.post('/v1/admin/project/exhibitors/generate_invite_code', {
      exhibitor_uuid: exhibitorId
    }, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    return { success: true, inviteCode: response.data.data?.inviteCode }
  } catch (error: any) {
    console.error('Error generating invite code:', error)
    return { success: false, error: 'Failed to generate invite code' }
  }
}

// Custom action for sending credentials
export async function sendExhibitorCredentials(projectUuid: string, exhibitorId: string, targetEmail?: string) {
  try {
    await api.post('/v1/admin/project/exhibitors/send_credentials', {
      exhibitor_uuid: exhibitorId,
      target_email: targetEmail
    }, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error sending credentials:', error)
    return { success: false, error: 'Failed to send credentials' }
  }
}
