'use server'

import api from '@/lib/api'
import { cookies } from 'next/headers'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuidParam?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = projectUuidParam || cookieStore.get('project_uuid')?.value
  
  return {
    projectUuid,
    headers: {
      'X-Project-UUID': projectUuid,
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }
}

// ... Types
export interface AdvancedSearchParams {
  start_date?: string
  end_date?: string
  attendee_type_codes?: string[]
  country?: string
  keyword?: string
  page?: number
  limit?: number
  include_questionnaire?: boolean
  is_include_staff: boolean
}

export interface AdvancedSearchResult {
  registration_uuid: string
  registration_code: string
  first_name: string
  last_name: string
  company_name: string
  attendee_type_code: string
  attendee_type_name?: string
  residence_country: string
  registered_at: string
}

export interface AdvancedSearchResponse {
  data: AdvancedSearchResult[]
  total: number
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function advancedSearch(params: AdvancedSearchParams) {
  try {
    const { headers, projectUuid } = await getAuthHeaders()

    // Map params to API expected body if necessary
    const payload = {
      project_uuid: projectUuid,
      start_date: params.start_date,
      end_date: params.end_date,
      attendee_type_codes: params.attendee_type_codes,
      country: params.country,
      keyword: params.keyword,
      page: params.page,
      limit: params.limit,
      include_questionnaire: params.include_questionnaire,
      is_include_staff: params.is_include_staff
    }

    const url = '/v1/admin/project/report/advanced-search'
    const response = await api.post(url, payload, { headers })

    return { success: true, data: response.data.data as AdvancedSearchResponse }
  } catch (error: unknown) {
    console.error('Error in advanced search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform advanced search'
    return { success: false, error: errorMessage }
  }
}

export async function organizerAdvancedSearch(params: AdvancedSearchParams) {
  try {
    const { headers, projectUuid } = await getAuthHeaders()

    const payload = {
      project_uuid: projectUuid,
      start_date: params.start_date,
      end_date: params.end_date,
      attendee_type_codes: params.attendee_type_codes,
      country: params.country,
      keyword: params.keyword,
      page: params.page,
      limit: params.limit,
      include_questionnaire: params.include_questionnaire,
      is_include_staff: params.is_include_staff
    }

    const url = '/v1/organizer/report/advanced-search'
    const response = await api.post(url, payload, { headers })

    return { success: true, data: response.data.data as AdvancedSearchResponse }
  } catch (error: unknown) {
    console.error('Error in organizer advanced search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform advanced search'
    return { success: false, error: errorMessage }
  }
}

export async function exportOrganizerAdvancedSearch(params: AdvancedSearchParams) {
  try {
    const { headers, projectUuid } = await getAuthHeaders()

    const payload = {
      project_uuid: projectUuid,
      start_date: params.start_date,
      end_date: params.end_date,
      attendee_type_codes: params.attendee_type_codes,
      country: params.country,
      keyword: params.keyword,
      page: params.page,
      limit: params.limit,
      include_questionnaire: params.include_questionnaire,
      is_include_staff: params.is_include_staff
    }

    const url = '/v1/organizer/report/export-excel-advanced-search'
    const response = await api.post(url, payload, { 
      headers, 
      responseType: 'arraybuffer' 
    })

    return { 
      success: true, 
      data: response.data,
      contentType: response.headers['content-type']
    }
  } catch (error: unknown) {
    console.error('Error in export organizer advanced search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to export advanced search'
    return { success: false, error: errorMessage }
  }
}

export interface Event {
  event_uuid: string
  event_code: string
  event_name: string
  is_active: boolean
  order_index: number
}

export async function getEventsForReport() {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/events', { headers })
    const result = response.data
    return { success: true, events: (result.data || []) as Event[] }
  } catch (error: unknown) {
    console.error('Error fetching events:', error)
    return { success: false, error: 'Failed to fetch events', events: [] as Event[] }
  }
}

export interface ConferenceNoHallResponse {
  registration_code: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  job_position: string;
  attendee_type_code: string;
  conference_name: string;
  scanned_at: string;
}

export interface ConferenceSummaryResponse {
  conference_uuid: string;
  title: string;
  show_date: string;
  start_time: string;
  end_time: string;
  room_name: string;
  quota: number;
  pre_registration: number;
  total_on_show: number;
  pre_registration_show_up: number;
  walk_in: number;
}

export async function getConferenceNoHall(event_uuid: string) {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get(`/v1/admin/project/report/conference-no-hall?event_uuid=${event_uuid}`, { headers })
    return { success: true, data: (response.data?.data || []) as ConferenceNoHallResponse[] }
  } catch (error: unknown) {
    console.error('Error fetching conference no hall data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
    return { success: false, error: errorMessage, data: [] }
  }
}

export async function getConferenceSummary() {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/report/conference-summary', { headers })
    return { success: true, data: (response.data?.data || []) as ConferenceSummaryResponse[] }
  } catch (error: unknown) {
    console.error('Error fetching conference summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference summary'
    return { success: false, error: errorMessage, data: [] }
  }
}

export async function exportConferenceSummary() {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/report/export-excel-conference-summary', { 
      headers,
      responseType: 'arraybuffer'
    })
    return { 
      success: true, 
      data: response.data,
      contentType: response.headers['content-type']
    }
  } catch (error: unknown) {
    console.error('Error exporting conference summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to export conference summary'
    return { success: false, error: errorMessage }
  }
}

export async function getOrganizerConferenceNoHall(event_uuid: string) {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get(`/v1/organizer/report/conference-no-hall?event_uuid=${event_uuid}`, { headers })
    return { success: true, data: (response.data?.data || []) as ConferenceNoHallResponse[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer conference no hall data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
    return { success: false, error: errorMessage, data: [] }
  }
}

export async function getOrganizerConferenceSummary() {
  try {
    const { headers } = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/report/conference-summary', { headers })
    return { success: true, data: (response.data?.data || []) as ConferenceSummaryResponse[] }
  } catch (error: unknown) {
    console.error('Error fetching organizer conference summary:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conference summary'
    return { success: false, error: errorMessage, data: [] }
  }
}

