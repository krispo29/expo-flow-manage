'use server'

import api from '@/lib/api'
import { cookies } from 'next/headers'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid || cookieStore.get('project_uuid')?.value,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdvancedSearchParams {
  start_date?: string    // e.g. "2024-01-01"
  end_date?: string      // e.g. "2029-12-31"
  attendee_type_codes?: string[]
  country?: string
  keyword?: string
  page?: number
  limit?: number
}

export interface AdvancedSearchResult {
  registration_uuid?: string
  registration_code?: string
  first_name?: string
  last_name?: string
  email?: string
  company_name?: string
  job_position?: string
  attendee_type_code?: string
  registered_at?: string
  residence_country?: string
  mobile_number?: string
  [key: string]: unknown
}

export interface AdvancedSearchResponse {
  data: AdvancedSearchResult[]
  total: number
  page: number
  limit: number
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function advancedSearch(params: AdvancedSearchParams) {
  try {
    const headers = await getAuthHeaders()

    // Build query params — attendee_type_codes needs to appear multiple times
    const searchParams = new URLSearchParams()

    if (params.start_date) searchParams.append('start_date', params.start_date)
    if (params.end_date) searchParams.append('end_date', params.end_date)
    if (params.country) searchParams.append('country', params.country)
    if (params.keyword) searchParams.append('keyword', params.keyword)
    if (params.page) searchParams.append('page', String(params.page))
    if (params.limit) searchParams.append('limit', String(params.limit))

    // Each attendee_type_code is appended separately for array format
    if (params.attendee_type_codes && params.attendee_type_codes.length > 0) {
      for (const code of params.attendee_type_codes) {
        searchParams.append('attendee_type_codes', code)
      }
    }

    const queryString = searchParams.toString()
    const url = `/v1/admin/project/report/advanced-search${queryString ? `?${queryString}` : ''}`

    const response = await api.get(url, { headers })

    return { success: true, data: response.data.data as AdvancedSearchResponse }
  } catch (error: unknown) {
    console.error('Error in advanced search:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to perform advanced search'
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
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/events', { headers })
    const result = response.data
    return { success: true, events: (result.data || []) as Event[] }
  } catch (error: unknown) {
    console.error('Error fetching events:', error)
    return { success: false, error: 'Failed to fetch events', events: [] as Event[] }
  }
}
