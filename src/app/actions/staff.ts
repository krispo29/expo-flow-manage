'use server'

import { revalidatePath } from 'next/cache'
import api from '@/lib/api'

export interface Staff {
  id: string
  exhibitorId: string
  title?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  position?: string
  type?: string
  isActive: boolean
  createdAt: string
  // Add other fields as needed
}

// GET /v1/admin/project/exhibitors/staff
export async function getStaffByExhibitorId(projectUuid: string, exhibitorId: string) {
  try {
    const response = await api.get('/v1/admin/project/exhibitors/staff', {
      headers: { 'X-Project-UUID': projectUuid },
      params: { exhibitor_uuid: exhibitorId }
    })
    return { success: true, staff: (response.data.data || []) as Staff[] }
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return { success: false, error: 'Failed to fetch staff' }
  }
}

// POST /v1/admin/project/exhibitors/staff
export async function createStaff(projectUuid: string, data: any) {
  try {
    const response = await api.post('/v1/admin/project/exhibitors/staff', data, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true, staff: response.data.data }
  } catch (error: any) {
    console.error('Error creating staff:', error)
    const errMsg = error.response?.data?.message || 'Failed to create staff'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/exhibitors/staff
export async function updateStaff(projectUuid: string, staffUuid: string, data: any) {
  try {
    const payload = { ...data, staff_uuid: staffUuid }
    const response = await api.put('/v1/admin/project/exhibitors/staff', payload, {
      headers: { 'X-Project-UUID': projectUuid }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true, staff: response.data.data }
  } catch (error: any) {
    console.error('Error updating staff:', error)
    const errMsg = error.response?.data?.message || 'Failed to update staff'
    return { success: false, error: errMsg }
  }
}

// DELETE /v1/admin/project/exhibitors/staff
export async function deleteStaff(projectUuid: string, staffId: string) {
  try {
    await api.delete('/v1/admin/project/exhibitors/staff', {
      headers: { 'X-Project-UUID': projectUuid },
      data: { staff_uuid: staffId }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting staff:', error)
    return { success: false, error: 'Failed to delete staff' }
  }
}

// Custom action for sending credentials
export async function sendStaffCredentials(projectUuid: string, staffId: string, targetEmail?: string) {
  try {
    await api.post('/v1/admin/project/exhibitors/staff/send_credentials', {
      staff_uuid: staffId,
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
