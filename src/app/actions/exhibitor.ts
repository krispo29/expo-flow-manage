'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'
import { getCountryNameFromValue } from '@/lib/countries'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import { isBusinessMatchingEnabled } from '@/lib/features'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid: string) {
  return requireServerAuthHeaders({ projectUuid })
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
  totalQuota?: number
  usedQuota: number
  overQuota: number
  isActive: boolean
  isQuotaFull?: boolean
  isBusinessMatchingReadyEmailSent?: boolean
  canSendBusinessMatchingReadyEmail?: boolean
  inviteCode?: string
  projectId?: string
  password?: string
  passwordNote?: string
  createdAt?: string
  companyProfile?: string
  companyLogo?: string
  productHighlights: ProductHighlight[]
}

export interface ProductHighlight {
  description: string
  url: string
}

export interface BusinessMatchingCategory {
  category_uuid: string
  name: string
  parent_uuid: string
  event_uuid: string
  event_code: string
}

export interface ExhibitorPayload {
  eventId: string
  username?: string
  password?: string
  companyName: string
  address?: string
  city?: string
  province?: string
  country?: string
  postalCode?: string
  phone?: string
  fax?: string
  contactPerson?: string
  email?: string
  website?: string
  boothNo?: string
  quota: number
  overQuota: number
  companyProfile?: string
  companyLogo?: string
  productHighlights?: ProductHighlight[]
  categoryUUIDs?: string[]
}

function getQuotaFullState(item: {
  is_quota_full?: boolean
  used_quota?: number
  total_quota?: number
}) {
  const usedQuota = Number(item.used_quota || 0)
  const totalQuota = Number(item.total_quota || 0)

  return Boolean(
    item.is_quota_full || (totalQuota > 0 && usedQuota >= totalQuota)
  )
}

function getExhibitorProfilePayload(data: ExhibitorPayload) {
  if (
    data.companyProfile === undefined &&
    data.companyLogo === undefined &&
    data.productHighlights === undefined
  ) {
    return {}
  }

  return {
    company_profile: data.companyProfile,
    company_logo: data.companyLogo,
    product_highlights: data.productHighlights || [],
  }
}

// GET /v1/admin/project/exhibitors
export async function getExhibitors(projectUuid: string) {
  // Verify user has access to this project
  await requireProjectContext(projectUuid)

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
      totalQuota: item.total_quota || 0,
      quota: 0, // Not provided in list
      overQuota: 0, // Not provided in list
      isQuotaFull: getQuotaFullState(item),
      passwordNote: item.password_note,
      isBusinessMatchingReadyEmailSent:
        item.is_business_matching_ready_email_sent,
      canSendBusinessMatchingReadyEmail:
        item.can_send_business_matching_ready_email,
    }))

    return { success: true, exhibitors: mappedExhibitors }
  } catch (error: any) {
    console.error('Error fetching exhibitors:', error)
    return { success: false, error: 'Failed to fetch exhibitors' }
  }
}

// POST /v1/admin/project/exhibitors
export async function createExhibitor(
  projectUuid: string,
  data: ExhibitorPayload
) {
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
      country: data.country
        ? getCountryNameFromValue(data.country)
        : data.country,
      postal_code: data.postalCode,
      tel: data.phone,
      fax: data.fax,
      contact_person: data.contactPerson,
      contact_email: data.email,
      website: data.website,
      booth_no: data.boothNo,
      quota: data.quota,
      over_quota: data.overQuota,
      ...(isBusinessMatchingEnabled(projectUuid) ? { category_uuids: data.categoryUUIDs || [] } : {}),
      ...getExhibitorProfilePayload(data),
    }

    const response = await api.post('/v1/admin/project/exhibitors', payload, {
      headers,
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
export async function updateExhibitor(
  projectUuid: string,
  exhibitorUuid: string,
  data: ExhibitorPayload
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = {
      exhibitor_uuid: exhibitorUuid,
      company_name: data.companyName,
      address: data.address,
      city: data.city,
      province: data.province,
      country: data.country
        ? getCountryNameFromValue(data.country)
        : data.country,
      postal_code: data.postalCode,
      tel: data.phone,
      fax: data.fax,
      contact_person: data.contactPerson,
      contact_email: data.email,
      website: data.website,
      booth_no: data.boothNo,
      quota: data.quota,
      over_quota: data.overQuota,
      ...(isBusinessMatchingEnabled(projectUuid) ? { category_uuids: data.categoryUUIDs || [] } : {}),
      ...getExhibitorProfilePayload(data),
    }

    const response = await api.put('/v1/admin/project/exhibitors', payload, {
      headers,
    })
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor: response.data.data }
  } catch (error: any) {
    console.error('Error updating exhibitor:', error)
    const errMsg = error.response?.data?.message || 'Failed to update exhibitor'
    return { success: false, error: errMsg }
  }
}

export async function getExhibitorBusinessMatchingCategories(
  projectUuid: string,
  eventUuid: string,
  exhibitorUuid?: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(
      '/v1/admin/project/exhibitors/business-matching/categories',
      {
        headers,
        params: { event_uuid: eventUuid, exhibitor_uuid: exhibitorUuid },
      }
    )
    return {
      success: true as const,
      categories: (response.data.data?.categories ||
        []) as BusinessMatchingCategory[],
      selectedCategoryUUIDs: (response.data.data?.selected_category_uuids ||
        []) as string[],
    }
  } catch (error: unknown) {
    return {
      success: false as const,
      error:
        getErrorMessage(error) ||
        'Failed to fetch business matching categories',
    }
  }
}

// DELETE /v1/admin/project/exhibitors
export async function deleteExhibitor(
  projectUuid: string,
  exhibitorId: string
) {
  // Verify user has access to this project before deletion
  await requireProjectContext(projectUuid)

  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.delete('/v1/admin/project/exhibitors', {
      headers,
      data: { exhibitor_uuid: exhibitorId },
    })
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting exhibitor:', error)
    return { success: false, error: 'Failed to delete exhibitor' }
  }
}

// GET /v1/admin/project/exhibitors/:id (Get One)
export async function getExhibitorById(
  projectUuid: string,
  exhibitorId: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(
      `/v1/admin/project/exhibitors/${exhibitorId}`,
      { headers }
    )

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
      isQuotaFull: rawData.is_quota_full,
      usedQuota: 0, // usually comes from members length or separated field
      totalQuota: rawData.total_quota || 0,
      createdAt: rawData.created_at,
      passwordNote: rawData.password_note,
      companyProfile: rawData.company_profile || '',
      companyLogo: rawData.company_logo || '',
      productHighlights: rawData.product_highlights || [],
    }

    return {
      success: true,
      exhibitor: mappedExhibitor,
      members: response.data.data.members,
    }
  } catch (error: any) {
    console.error('Error fetching exhibitor:', error)
    return { success: false, error: 'Failed to fetch exhibitor' }
  }
}

export async function presignExhibitorImage(
  projectUuid: string,
  file: { filename: string; contentType: string }
) {
  try {
    if (!file.filename || !file.contentType)
      return { success: false, error: 'Image file is required' }

    const headers = await requireServerAuthHeaders({
      projectUuid: projectUuid || undefined,
    })
    const response = await api.post(
      '/v1/exhibitor/upload/presign',
      {
        filename: file.filename,
        content_type: file.contentType,
      },
      {
        headers,
      }
    )
    const data = response.data?.data

    return typeof data?.upload_url === 'string' &&
      typeof data?.file_url === 'string'
      ? { success: true, uploadUrl: data.upload_url, fileUrl: data.file_url }
      : { success: false, error: 'Signed URL response is missing upload URL' }
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) }
  }
}

// Custom action for generating invite code
export async function generateInviteCode(
  projectUuid: string,
  exhibitorId: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.post(
      '/v1/admin/project/exhibitors/generate_invite_code',
      {
        exhibitor_uuid: exhibitorId,
      },
      { headers }
    )
    return { success: true, inviteCode: response.data.data?.inviteCode }
  } catch (error: any) {
    console.error('Error generating invite code:', error)
    return { success: false, error: 'Failed to generate invite code' }
  }
}

// Custom action for sending credentials
export async function sendExhibitorCredentials(
  projectUuid: string,
  exhibitorId: string,
  email?: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const payload = email
      ? [{ exhibitor_uuid: exhibitorId, email }]
      : [exhibitorId]

    await api.post(
      '/v1/admin/project/exhibitors/send_mail_credential',
      payload,
      { headers }
    )
    return { success: true }
  } catch (error: any) {
    console.error('Error sending credentials:', error)
    return { success: false, error: 'Failed to send credentials' }
  }
}

// GET /v1/admin/project/exhibitors/:id/members (Get Members subset)
export async function getExhibitorMembers(
  projectUuid: string,
  exhibitorId: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(
      `/v1/admin/project/exhibitors/${exhibitorId}/members/`,
      { headers }
    )
    return { success: true, members: response.data.data }
  } catch (error: any) {
    console.error('Error fetching exhibitor members:', error)
    return { success: false, error: 'Failed to fetch exhibitor members' }
  }
}

// PATCH /v1/admin/project/exhibitors/force_reset_password
export async function forcePasswordResetExhibitor(
  projectUuid: string,
  exhibitorId: string,
  newPassword: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch(
      '/v1/admin/project/exhibitors/force_reset_password',
      {
        exhibitor_uuid: exhibitorId,
        new_password: newPassword,
      },
      { headers }
    )
    return { success: true }
  } catch (error: any) {
    console.error('Error resetting password:', error)
    const errMsg = error.response?.data?.message || 'Failed to reset password'
    return { success: false, error: errMsg }
  }
}

// PATCH /v1/admin/project/exhibitors/toggle_status
export async function toggleStatusExhibitor(
  projectUuid: string,
  exhibitorId: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.patch(
      '/v1/admin/project/exhibitors/toggle_status',
      {
        exhibitor_uuid: exhibitorId,
      },
      { headers }
    )
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
    const response = await api.post(
      '/v1/admin/project/exhibitors/login',
      data,
      { headers }
    )
    return { success: true, data: response.data }
  } catch (error: any) {
    console.error('Error testing exhibitor login:', error)
    const errMsg = error.response?.data?.message || 'Invalid credentials'
    return { success: false, error: errMsg }
  }
}
