'use server'

import { revalidatePath } from 'next/cache'
import axios from 'axios'
import api, { getErrorMessage } from '@/lib/api'
import { isTokenExpiredError } from '@/lib/auth-helpers'
import { getServerAuthHeaders, requireServerAuthHeaders } from '@/lib/server-auth'

export interface Project {
  project_uuid: string
  company_uuid: string
  project_code: string
  project_name: string
  project_site_url: string
  is_open_registration: boolean
  is_individual_registration_open?: boolean
  is_group_registration_open?: boolean
  start_date: string
  end_date: string
  cutoff_date_exhibitor_edit: string
  logo_url: string
  banner_url: string
  banner_2_url: string
  copy_right: string
  country_code?: string
  timezone?: string
  conference_booking_url?: string
  exhibitor_portal_url?: string
  status?: string
  attendance_marker_code?: string
  settings?: Record<string, unknown>
  created_at: string
  updated_at: string
}

function isProjectTokenExpiredError(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error) && isTokenExpiredError(error)
}

// GET /v1/admin/projects (No X-Project-UUID header, but needs Authorization)
export async function getProjects() {
  try {
    const headers = await getServerAuthHeaders({ includeProjectUuid: false })

    if (!headers) {
      return { success: false, error: 'Unauthorized', projects: [] as Project[] }
    }

    const response = await api.get('/v1/admin/projects', { headers })
    const result = response.data
    console.log('Projects API response:', result)
    
    const projects = (result.data || []) as Project[]
    
    return { success: true, projects }
  } catch (error: unknown) {
    console.error('Error fetching projects:', error)
    console.error('Error details:', axios.isAxiosError(error) ? error.response?.data : undefined)

    // During layout/page render we cannot mutate cookies, so just signal the caller
    // to redirect to login. The login page will clear stale auth cookies safely.
    if (isProjectTokenExpiredError(error)) {
      return { success: false, error: 'key incorrect', projects: [] as Project[] }
    }

    const errorMessage = getErrorMessage(error) || 'Failed to fetch projects'
    return { success: false, error: errorMessage, projects: [] as Project[] }
  }
}

// GET /v1/admin/project/detail
export async function getProjectDetail(uuid: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid: uuid })

    const response = await api.get('/v1/admin/project/detail', { headers })
    const result = response.data
    return { success: true, project: result.data as Project }
  } catch (error: unknown) {
    console.error('Error fetching project detail:', error)
    return { success: false, error: 'Failed to fetch project detail' }
  }
}

export interface ShowDate {
  label: string
  value: string
}

// GET /v1/admin/project/detail/show_dates
export async function getProjectShowDates(uuid: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid: uuid })

    const response = await api.get('/v1/admin/project/detail/show_dates', {
      headers,
    })
    const result = response.data
    return { success: true, showDates: (result.data || []) as ShowDate[] }
  } catch (error: unknown) {
    console.error('Error fetching project show dates:', error)
    return {
      success: false,
      error: 'Failed to fetch show dates',
      showDates: [] as ShowDate[],
    }
  }
}

export interface Country {
  code: string
  name: string
  nationality: string
}

// GET /v1/admin/project/countries
export async function getCountries(projectUuid?: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })

    const response = await api.get('/v1/admin/project/countries', { headers })
    return { success: true, data: (response.data.data || []) as Country[] }
  } catch (error: unknown) {
    console.error('Error fetching countries:', error)
    return { success: false, error: 'Failed to fetch countries', data: [] }
  }
}

export interface Nationality {
  code: string
  nationality: string
}

// GET /v1/admin/project/nationalities
export async function getNationalities(projectUuid?: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })

    const response = await api.get('/v1/admin/project/nationalities', { headers })
    return { success: true, data: (response.data.data || []) as Nationality[] }
  } catch (error: unknown) {
    console.error('Error fetching nationalities:', error)
    return { success: false, error: 'Failed to fetch nationalities', data: [] }
  }
}

export interface MobilePrefix {
  code: string
  prefix: string
  name: string
}

// GET /v1/admin/project/mobile-prefixes
export async function getMobilePrefixes(projectUuid?: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })

    const response = await api.get('/v1/admin/project/mobile-prefixes', { headers })
    return { success: true, data: (response.data.data || []) as MobilePrefix[] }
  } catch (error: unknown) {
    console.error('Error fetching mobile prefixes:', error)
    return { success: false, error: 'Failed to fetch mobile prefixes', data: [] }
  }
}

export interface Timezone {
  label: string
  value: string
}

// GET /v1/admin/project/timezones
export async function getTimezones(projectUuid?: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })

    const response = await api.get('/v1/admin/project/timezones', { headers })
    return { success: true, data: (response.data.data || []) as Timezone[] }
  } catch (error: unknown) {
    console.error('Error fetching timezones:', error)
    return { success: false, error: 'Failed to fetch timezones', data: [] }
  }
}

// PUT /v1/admin/project/detail
export async function updateProject(
  projectData: Partial<Project> & { project_uuid: string }
) {
  try {
    const headers = await requireServerAuthHeaders({
      projectUuid: projectData.project_uuid,
    })

    await api.put('/v1/admin/project/detail', projectData, {
      headers,
    })

    revalidatePath('/admin/projects')
    return { success: true, project: projectData }
  } catch (error: unknown) {
    console.error('Error updating project:', error)
    const errMsg = getErrorMessage(error) || 'Failed to update project'
    return { success: false, error: errMsg }
  }
}
