'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import api from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'

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
  // Verify user has access to this project
  await requireProjectContext(projectUuid)
  
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
      email: data.email,
      company_name: data.companyName || "",
      company_country: data.companyCountry || "TH",
      company_tel: data.companyTel || ""
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
  // Verify user has access to this project before deletion
  await requireProjectContext(projectUuid)
  
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

// GET /v1/admin/project/staff
export async function getProjectStaffs(projectUuid: string, page: number = 1, limit: number = 20, keyword: string = '') {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/staff', {
      headers,
      params: { page, limit, keyword }
    })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error fetching project staffs:', error)
    return { success: false, error: 'Failed to fetch staff' }
  }
}

// POST /v1/admin/project/staff
export async function createProjectStaff(projectUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      title: data.title,
      first_name: data.first_name,
      last_name: data.last_name,
      company_name: data.company_name,
      staff_type_code: data.staff_type_code === 'ONSITE' ? 'ST' : data.staff_type_code === 'ORGANIZER' ? 'OR' : data.staff_type_code,
    }

    const response = await api.post('/v1/admin/project/staff', payload, { headers })
    revalidatePath('/admin/staff')
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error creating project staff:', error)
    const errMsg = error.response?.data?.message || 'Failed to create staff'
    return { success: false, error: errMsg }
  }
}

// GET /v1/admin/project/staff/types
export async function getStaffTypes(projectUuid?: string) {
  try {
    const headers = await getAuthHeaders(projectUuid || '')
    const response = await api.get('/v1/admin/project/staff/types', { headers })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error fetching staff types:', error)
    return { success: false, error: 'Failed to fetch staff types' }
  }
}

// GET /v1/admin/project/staff/{staffID}
export async function getProjectStaffById(projectUuid: string, staffId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(`/v1/admin/project/staff/${staffId}`, { headers })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error fetching project staff by id:', error)
    return { success: false, error: 'Failed to fetch staff details' }
  }
}

// PUT /v1/admin/project/staff/{staffID}
export async function updateProjectStaff(projectUuid: string, staffId: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      title: data.title,
      first_name: data.first_name,
      last_name: data.last_name,
      company_name: data.company_name,
    }

    const response = await api.put(`/v1/admin/project/staff/${staffId}`, payload, { headers })
    revalidatePath('/admin/staff')
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error updating project staff:', error)
    const errMsg = error.response?.data?.message || 'Failed to update staff'
    return { success: false, error: errMsg }
  }
}

// DELETE /v1/admin/project/staff/{staffID}
export async function deleteProjectStaff(projectUuid: string, staffId: string) {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.delete(`/v1/admin/project/staff/${staffId}`, { headers })
    revalidatePath('/admin/staff')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting project staff:', error)
    return { success: false, error: 'Failed to delete staff' }
  }
}

// POST /v1/admin/project/staff/{staffID}/print
export async function printProjectStaffBadge(projectUuid: string, staffId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.post(`/v1/admin/project/staff/${staffId}/print`, {}, { headers })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error printing project staff badge:', error)
    const errMsg = error.response?.data?.message || 'Failed to print badge'
    return { success: false, error: errMsg }
  }
}


