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

export interface Exhibitor {
  id: string
  eventId: string
  eventName: string
  companyName: string
  username?: string // Registration ID
  boothNo?: string
  zone?: string
  email?: string
  phone?: string
  contactName?: string
  contactPerson?: string
  fax?: string
  website?: string
  address?: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
  quota: number
  usedQuota: number
  overQuota: number
  isActive: boolean
  inviteCode?: string
  projectId?: string
  password?: string
  passwordNote?: string
  createdAt?: string
}

// GET /v1/admin/project/exhibitors
export async function getExhibitors(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/exhibitors', { headers })
    
    // The API returns an array directly in data.data
    const exhibitorsList = response.data.data || []
    
    // Map to camelCase Exhibitor frontend interface
    const mappedExhibitors: Exhibitor[] = exhibitorsList.map((item: any) => ({
      id: item.exhibitor_uuid,
      eventName: item.event_name || '',
      eventId: item.event_uuid || '', // Might not be returned in list
      companyName: item.company_name,
      username: item.username,
      email: item.contact_email,
      address: item.address,
      boothNo: item.booth_no,
      isActive: item.is_active,
      usedQuota: item.used_quota || 0,
      quota: 0, // Not provided in list
      overQuota: 0, // Not provided in list
      passwordNote: item.password_note
    }))

    return { success: true, exhibitors: mappedExhibitors }
  } catch (error: any) {
    console.error('Error fetching exhibitors:', error)
    return { success: false, error: 'Failed to fetch exhibitors' }
  }
}

// POST /v1/admin/project/exhibitors
export async function createExhibitor(projectUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      event_uuid: data.eventId,
      username: data.username,
      password: data.password,
      company_name: data.companyName,
      address: data.address,
      city: data.city,
      province: data.province,
      country: data.country,
      postal_code: data.postalCode,
      tel: data.phone,
      fax: data.fax,
      contact_person: data.contactPerson,
      contact_email: data.email,
      website: data.website,
      booth_no: data.boothNo,
      quota: data.quota,
      over_quota: data.overQuota
    }

    const response = await api.post('/v1/admin/project/exhibitors', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error creating exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to create exhibitor'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/exhibitors
export async function updateExhibitor(projectUuid: string, exhibitorUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      exhibitor_uuid: exhibitorUuid,
      company_name: data.companyName,
      address: data.address,
      city: data.city,
      province: data.province,
      country: data.country,
      postal_code: data.postalCode,
      tel: data.phone,
      fax: data.fax,
      contact_person: data.contactPerson,
      contact_email: data.email,
      website: data.website,
      booth_no: data.boothNo,
      quota: data.quota,
      over_quota: data.overQuota
    }

    const response = await api.put('/v1/admin/project/exhibitors', payload, { headers })
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
    const headers = await getAuthHeaders(projectUuid)
    await api.delete('/v1/admin/project/exhibitors', {
      headers,
      data: { exhibitor_uuid: exhibitorId }
    })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting exhibitor:', error)
    return { success: false, error: 'Failed to delete exhibitor' }
  }
}

// GET /v1/admin/project/exhibitors/:id (Get One)
export async function getExhibitorById(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(`/v1/admin/project/exhibitors/${exhibitorId}`, { headers })
    
    // API returns { data: { info: {...}, members: [...] } }
    const rawData = response.data.data.info
    
    if (!rawData) {
      return { success: false, error: 'Exhibitor info not found' }
    }

    const mappedExhibitor: Exhibitor = {
      id: rawData.exhibitor_uuid,
      projectId: rawData.project_uuid,
      eventId: rawData.event_uuid,
      eventName: '', // Not in info obj
      username: rawData.username,
      companyName: rawData.company_name,
      address: rawData.address,
      city: rawData.city,
      province: rawData.province,
      country: rawData.country,
      postalCode: rawData.postal_code,
      phone: rawData.tel,
      fax: rawData.fax,
      contactPerson: rawData.contact_person,
      email: rawData.contact_email,
      website: rawData.website,
      boothNo: rawData.booth_no,
      quota: rawData.quota,
      overQuota: rawData.over_quota,
      isActive: rawData.is_active,
      usedQuota: 0, // usually comes from members length or separated field
      createdAt: rawData.created_at,
      passwordNote: rawData.password_note
    }

    return { success: true, exhibitor: mappedExhibitor, members: response.data.data.members }
  } catch (error: any) {
    console.error('Error fetching exhibitor:', error)
    return { success: false, error: 'Failed to fetch exhibitor' }
  }
}

// Custom action for generating invite code
export async function generateInviteCode(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.post('/v1/admin/project/exhibitors/generate_invite_code', {
      exhibitor_uuid: exhibitorId
    }, { headers })
    return { success: true, inviteCode: response.data.data?.inviteCode }
  } catch (error: any) {
    console.error('Error generating invite code:', error)
    return { success: false, error: 'Failed to generate invite code' }
  }
}

// Custom action for sending credentials
export async function sendExhibitorCredentials(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.post('/v1/admin/project/exhibitors/send_mail_credential', [
      exhibitorId
    ], { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error sending credentials:', error)
    return { success: false, error: 'Failed to send credentials' }
  }
}

// GET /v1/admin/project/exhibitors/:id/members (Get Members subset)
export async function getExhibitorMembers(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(`/v1/admin/project/exhibitors/${exhibitorId}/members/`, { headers })
    return { success: true, members: response.data.data }
  } catch (error: any) {
    console.error('Error fetching exhibitor members:', error)
    return { success: false, error: 'Failed to fetch exhibitor members' }
  }
}

// PATCH /v1/admin/project/exhibitors/force_reset_password
export async function forcePasswordResetExhibitor(projectUuid: string, exhibitorId: string, newPassword: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch('/v1/admin/project/exhibitors/force_reset_password', {
      exhibitor_uuid: exhibitorId,
      new_password: newPassword
    }, { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error resetting password:', error)
    const errMsg = error.response?.data?.message || 'Failed to reset password'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/admin/project/exhibitors/toggle_status
export async function toggleStatusExhibitor(projectUuid: string, exhibitorId: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch('/v1/admin/project/exhibitors/toggle_status', {
      exhibitor_uuid: exhibitorId
    }, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}

// POST /v1/admin/project/exhibitors/login
export async function testLoginExhibitor(projectUuid: string, data: any) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.post('/v1/admin/project/exhibitors/login', data, { headers })
    return { success: true, data: response.data }
  } catch (error: any) {
    console.error('Error testing exhibitor login:', error)
    const errMsg = error.response?.data?.message || 'Invalid credentials'
    return { success: false, error: errMsg }
  }
}
