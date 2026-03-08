'use server'

import api from '@/lib/api'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

async function getAuthHeaders(projectUuid?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  return {
    'X-Project-UUID': projectUuid || cookieStore.get('project_uuid')?.value,
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export interface ImportEvent {
  event_uuid: string
  event_code: string
  event_name: string
  is_active: boolean
  order_index: number
}

export interface ImportExhibitor {
  exhibitor_uuid: string
  event_name: string
  company_name: string
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

    const mapped = ((response.data?.data || []) as any[]).map((item) => ({
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

async function postImport(endpoint: string, formData: FormData) {
  const headers = await getAuthHeaders()
  await api.post(endpoint, formData, {
    headers: {
      ...headers,
      'Content-Type': 'multipart/form-data',
    },
  })
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
