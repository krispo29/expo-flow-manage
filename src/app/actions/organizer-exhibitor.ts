'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

// Re-export shared interfaces
export type { Exhibitor } from './exhibitor'
import type { Exhibitor } from './exhibitor'

// Helper function to get headers with auth (uses cookie-based project_uuid)
async function getOrganizerAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value
  
  return {
    ...(projectUuid && { 'X-Project-UUID': projectUuid }),
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// GET /v1/organizer/exhibitors
export async function getOrganizerExhibitors() {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/exhibitors', { headers })
    
    const exhibitorsList = response.data.data || []
    
    // Map to camelCase Exhibitor frontend interface
    const mappedExhibitors: Exhibitor[] = exhibitorsList.map((item: any) => ({
      id: item.exhibitor_uuid,
      eventName: item.event_name || '',
      eventId: item.event_uuid || '',
      companyName: item.company_name,
      username: item.username,
      email: item.contact_email,
      address: item.address,
      boothNo: item.booth_no,
      isActive: item.is_active,
      usedQuota: item.used_quota || 0,
      quota: 0,
      overQuota: 0,
      passwordNote: item.password_note
    }))

    return { success: true, exhibitors: mappedExhibitors }
  } catch (error: any) {
    console.error('Error fetching organizer exhibitors:', error)
    return { success: false, error: 'Failed to fetch exhibitors' }
  }
}

// GET /v1/organizer/exhibitors/:id
export async function getOrganizerExhibitorById(exhibitorId: string) {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get(`/v1/organizer/exhibitors/${exhibitorId}`, { headers })
    
    const rawData = response.data.data.info
    
    if (!rawData) {
      return { success: false, error: 'Exhibitor info not found' }
    }

    const mappedExhibitor: Exhibitor = {
      id: rawData.exhibitor_uuid,
      projectId: rawData.project_uuid,
      eventId: rawData.event_uuid,
      eventName: '',
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
      usedQuota: 0,
      createdAt: rawData.created_at,
      passwordNote: rawData.password_note
    }

    return { success: true, exhibitor: mappedExhibitor, members: response.data.data.members }
  } catch (error: any) {
    console.error('Error fetching organizer exhibitor:', error)
    return { success: false, error: 'Failed to fetch exhibitor' }
  }
}

// POST /v1/organizer/exhibitors
export async function createOrganizerExhibitor(data: any) {
  try {
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

    const headers = await getOrganizerAuthHeaders()
    const response = await api.post('/v1/organizer/exhibitors', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error creating organizer exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to create exhibitor'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/organizer/exhibitors
export async function updateOrganizerExhibitor(exhibitorUuid: string, data: any) {
  try {
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

    const headers = await getOrganizerAuthHeaders()
    const response = await api.put('/v1/organizer/exhibitors', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error updating organizer exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to update exhibitor'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/organizer/exhibitors/:id/force_reset_password
export async function forceResetPasswordOrganizerExhibitor(exhibitorUuid: string, newPassword: string) {
  try {
    const headers = await getOrganizerAuthHeaders()
    await api.patch(`/v1/organizer/exhibitors/${exhibitorUuid}/force_reset_password`, {
      exhibitor_uuid: exhibitorUuid,
      new_password: newPassword
    }, { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error resetting organizer exhibitor password:', error)
    const errMsg = error.response?.data?.message || 'Failed to reset password'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/organizer/exhibitors/:id/toggle_status
export async function toggleStatusOrganizerExhibitor(exhibitorUuid: string) {
  try {
    const headers = await getOrganizerAuthHeaders()
    await api.patch(`/v1/organizer/exhibitors/${exhibitorUuid}/toggle_status`, {
      exhibitor_uuid: exhibitorUuid
    }, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling organizer exhibitor status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}

// POST /v1/organizer/exhibitors/send_mail_credential
export async function sendMailCredentialOrganizerExhibitor(exhibitorUuids: string[]) {
  try {
    const headers = await getOrganizerAuthHeaders()
    await api.post('/v1/organizer/exhibitors/send_mail_credential', exhibitorUuids, { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error sending organizer exhibitor credentials:', error)
    return { success: false, error: 'Failed to send credentials' }
  }
}

// GET /v1/organizer/exhibitors/:id/members/
export async function getOrganizerExhibitorMembers(exhibitorId: string) {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get(`/v1/organizer/exhibitors/${exhibitorId}/members/`, { headers })
    return { success: true, members: response.data.data }
  } catch (error: any) {
    console.error('Error fetching organizer exhibitor members:', error)
    return { success: false, error: 'Failed to fetch exhibitor members' }
  }
}

// GET /v1/admin/project/events (for organizer event dropdown)
export async function getOrganizerEvents() {
  try {
    const headers = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/admin/project/events', { headers })
    const result = response.data
    return { success: true, events: (result.data || []) }
  } catch (error: any) {
    console.error('Error fetching organizer events:', error)
    return { success: false, error: 'Failed to fetch events', events: [] }
  }
}

export async function createOrganizerMember(data: any) {
  try {
    const payload = {
      exhibitor_uuid: data.exhibitorId,
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

    const headers = await getOrganizerAuthHeaders()
    const response = await api.post('/v1/organizer/exhibitors/members/', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, member: response.data.data }
  } catch (error: any) {
    console.error('Error creating organizer member:', error)
    const errMsg = error.response?.data?.message || 'Failed to create member'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/organizer/exhibitors/members/ (Update Member)
export async function updateOrganizerMember(memberUuid: string, data: any) {
  try {
    const payload = {
      exhibitor_uuid: data.exhibitorId,
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

    const headers = await getOrganizerAuthHeaders()
    const response = await api.put('/v1/organizer/exhibitors/members/', payload, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true, member: response.data.data }
  } catch (error: any) {
    console.error('Error updating organizer member:', error)
    const errMsg = error.response?.data?.message || 'Failed to update member'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/organizer/exhibitors/members/toggle_status
export async function toggleStatusOrganizerMember(exhibitorUuid: string, memberUuid: string) {
  try {
    const headers = await getOrganizerAuthHeaders()
    await api.patch('/v1/organizer/exhibitors/members/toggle_status', {
      exhibitor_uuid: exhibitorUuid,
      member_uuid: memberUuid
    }, { headers })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error toggling organizer member status:', error)
    const errMsg = error.response?.data?.message || 'Failed to toggle status'
    return { success: false, error: errMsg }
  }
}

// POST /v1/organizer/exhibitors/members/resend_email_comfirmation
export async function resendEmailOrganizerMember(memberUuids: string[]) {
  try {
    const headers = await getOrganizerAuthHeaders()
    await api.post('/v1/organizer/exhibitors/members/resend_email_comfirmation', memberUuids, { headers })
    return { success: true }
  } catch (error: any) {
    console.error('Error resending organizer member email:', error)
    return { success: false, error: 'Failed to send confirmation email' }
  }
}

// POST /v1/organizer/exhibitors/login
export async function testLoginOrganizerExhibitor(data: any) {
  try {
    const payload = {
      username: data.username,
      password: data.password
    }

    const headers = await getOrganizerAuthHeaders()
    const response = await api.post('/v1/organizer/exhibitors/login', payload, { headers })
    return { success: true, data: response.data.data }
  } catch (error: any) {
    console.error('Error testing organizer exhibitor login:', error)
    const errMsg = error.response?.data?.message || 'Invalid username or password'
    return { success: false, error: errMsg }
  }
}
