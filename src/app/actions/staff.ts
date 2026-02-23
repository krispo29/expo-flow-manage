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

export interface Staff {
  id: string
  exhibitorId: string
  registrationCode?: string
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
  companyName?: string
  companyCountry?: string
  companyTel?: string
}

// GET /v1/admin/project/exhibitors/staff
export async function getStaffByExhibitorId(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/exhibitors/staff', {
      headers,
      params: { exhibitor_uuid: exhibitorId }
    })
    return { success: true, staff: (response.data.data || []) as Staff[] }
  } catch (error: any) {
    console.error('Error fetching staff:', error)
    return { success: false, error: 'Failed to fetch staff' }
  }
}

// POST /v1/admin/project/exhibitors/members
export async function createStaff(projectUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      exhibitor_uuid: data.exhibitorId,
      title: data.title,
      title_other: data.title_other || "",
      first_name: data.firstName,
      last_name: data.lastName,
      job_position: data.position,
      mobile_country_code: "66", // Defaulting to 66 for now or extract from data if available
      mobile_number: data.mobile,
      email: data.email,
      company_name: data.companyName || "",
      company_country: data.companyCountry || "TH",
      company_tel: data.companyTel || ""
    }

    const response = await api.post('/v1/admin/project/exhibitors/members', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, member: response.data.data }
  } catch (error: any) {
    console.error('Error creating member:', error)
    const errMsg = error.response?.data?.message || 'Failed to create member'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/exhibitors/members/
export async function updateStaff(projectUuid: string, memberUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      exhibitor_uuid: data.exhibitorId, // Needs to be passed down or handled
      member_uuid: memberUuid,
      title: data.title,
      title_other: data.title_other || "",
      first_name: data.firstName,
      last_name: data.lastName,
      job_position: data.position,
      mobile_country_code: "66",
      mobile_number: data.mobile,
      email: data.email
    }

    const response = await api.put('/v1/admin/project/exhibitors/members/', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, member: response.data.data }
  } catch (error: any) {
    console.error('Error updating member:', error)
    const errMsg = error.response?.data?.message || 'Failed to update member'
    return { success: false, error: errMsg }
  }
}

// DELETE /v1/admin/project/exhibitors/members
export async function deleteStaff(projectUuid: string, memberId: string, exhibitorId?: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.delete('/v1/admin/project/exhibitors/members', {
      headers,
      data: { member_uuid: memberId, exhibitor_uuid: exhibitorId }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting member:', error)
    return { success: false, error: 'Failed to delete member' }
  }
}

// POST /v1/admin/project/exhibitors/members/resend_email_comfirmation
export async function sendStaffCredentials(projectUuid: string, memberId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/exhibitors/members/resend_email_comfirmation', [
      memberId
    ], { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error sending credentials:', error)
    return { success: false, error: 'Failed to send credentials' }
  }
}

// PATCH /v1/admin/project/exhibitors/members/toggle_status
export async function toggleStatusStaff(projectUuid: string, memberId: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch('/v1/admin/project/exhibitors/members/toggle_status', {
      exhibitor_uuid: exhibitorId,
      member_uuid: memberId
    }, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling member status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}
