'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { requireServerAuthHeaders } from '@/lib/server-auth'

async function getAuthHeaders(projectUuid?: string) {
  return requireServerAuthHeaders({ projectUuid })
}

export interface ImportEvent {
  event_uuid: string
  event_code: string
  event_name: string
  is_active: boolean
  order_index: number
}

export interface ImportHistory {
  import_uuid: string
  project_uuid: string
  import_type: string
  original_file_url: string
  original_file_name: string
  total_rows: number
  success_count: number
  failed_count: number
  created_by: string
  created_at: string
  error_messages?: ImportErrorMessage[]
}

export interface ImportErrorMessage {
  row: number
  detail: string
}

export interface ImportExhibitor {
  exhibitor_uuid: string
  event_name: string
  company_name: string
}

export interface ImportHistoryCode {
  first_name: string
  last_name: string
  email: string
  code: string
  company_name: string
}

type RawImportHistoryCode = Partial<Record<
  | 'first_name'
  | 'firstName'
  | 'last_name'
  | 'lastName'
  | 'full_name'
  | 'name'
  | 'email'
  | 'contact_email'
  | 'code'
  | 'registration_code'
  | 'staff_code'
  | 'member_code'
  | 'company_name'
  | 'companyName',
  unknown
>>

function textValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function normalizeImportHistoryCode(item: RawImportHistoryCode): ImportHistoryCode {
  const fullName = textValue(item.full_name ?? item.name).trim()
  const [fallbackFirstName = '', ...fallbackLastNameParts] = fullName.split(/\s+/).filter(Boolean)

  return {
    first_name: textValue(item.first_name ?? item.firstName) || fallbackFirstName,
    last_name: textValue(item.last_name ?? item.lastName) || fallbackLastNameParts.join(' '),
    email: textValue(item.email ?? item.contact_email),
    code: textValue(item.code ?? item.registration_code ?? item.staff_code ?? item.member_code),
    company_name: textValue(item.company_name ?? item.companyName),
  }
}

export async function getImportEvents() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/events', { headers })
    return { success: true, data: (response.data?.data || []) as ImportEvent[] }
  } catch (error: unknown) {
    console.error('Error fetching import events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch events'
    return { success: false, error: errorMessage, data: [] as ImportEvent[] }
  }
}

export async function getImportExhibitors() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/exhibitors', { headers })

    const mapped = ((response.data?.data || []) as { exhibitor_uuid: string; event_name: string; company_name: string }[]).map((item) => ({
      exhibitor_uuid: item.exhibitor_uuid,
      event_name: item.event_name,
      company_name: item.company_name,
    })) as ImportExhibitor[]

    return { success: true, data: mapped }
  } catch (error: unknown) {
    console.error('Error fetching import exhibitors:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exhibitors'
    return { success: false, error: errorMessage, data: [] as ImportExhibitor[] }
  }
}

export async function getImportHistories() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/import/histories', { headers })
    return { success: true, data: (response.data?.data || []) as ImportHistory[] }
  } catch (error: unknown) {
    console.error('Error fetching import histories:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch import histories'
    return { success: false, error: errorMessage, data: [] as ImportHistory[] }
  }
}

async function postImport(endpoint: string, formData: FormData) {
  const headers = await getAuthHeaders()
  await api.post(endpoint, formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  })
}

export async function getImportHistory(uuid: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get(`/v1/admin/project/import/histories/${uuid}`, { headers })
    return { success: true, data: response.data?.data as ImportHistory }
  } catch (error: unknown) {
    console.error('Error fetching import history:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch import history'
    return { success: false, error: errorMessage }
  }
}

export async function getImportHistoryCodes(uuid: string, attendeeTypeCode?: string) {
  try {
    const headers = await getAuthHeaders()
    let url = `/v1/admin/project/import/histories/${uuid}/codes`
    if (attendeeTypeCode) {
      url += `?attendee_type_code=${attendeeTypeCode}`
    }
    const response = await api.get(url, { headers })
    const data = ((response.data?.data || []) as RawImportHistoryCode[]).map(normalizeImportHistoryCode)
    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error fetching import history codes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch import history codes'
    return { success: false, error: errorMessage, data: [] as ImportHistoryCode[] }
  }
}

export async function importExhibitors(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/exhibitors', formData)
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing exhibitors:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import exhibitors'
    return { success: false, error: errorMessage }
  }
}

export async function importExhibitorMembers(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/exhibitor-members', formData)
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing exhibitor members:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import exhibitor members'
    return { success: false, error: errorMessage }
  }
}

export async function importRegistrations(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/registrations', formData)
    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing registrations:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import registrations'
    return { success: false, error: errorMessage }
  }
}

export async function importStaff(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/staff', formData)
    revalidatePath('/admin/staff')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing staff:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import staff'
    return { success: false, error: errorMessage }
  }
}

export async function importConferencesExcel(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/conferences', formData)
    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing conferences:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import conferences'
    return { success: false, error: errorMessage }
  }
}

export async function importInviteCodes(formData: FormData) {
  try {
    await postImport('/v1/admin/project/import/invite-codes', formData)
    revalidatePath('/admin/invitation-codes')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error importing invite codes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to import invite codes'
    return { success: false, error: errorMessage }
  }
}
