'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import api from '@/lib/api'
import { isTokenExpiredError } from '@/lib/auth-helpers'

export interface Project {
  project_uuid: string
  company_uuid: string
  project_code: string
  project_name: string
  project_site_url: string
  is_open_registration: boolean
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
  created_at: string
  updated_at: string
}

// GET /v1/admin/projects (No X-Project-UUID header, but needs Authorization)
export async function getProjects() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get('/v1/admin/projects', { headers })
    const result = response.data
    console.log('Projects API response:', result)
    
    const projects = (result.data || []) as Project[]
    
    return { success: true, projects }
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    console.error('Error details:', error.response?.data)

    // During layout/page render we cannot mutate cookies, so just signal the caller
    // to redirect to login. The login page will clear stale auth cookies safely.
    if (isTokenExpiredError(error)) {
      return { success: false, error: 'key incorrect', projects: [] as Project[] }
    }

    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'Failed to fetch projects'
    return { success: false, error: errorMessage, projects: [] as Project[] }
  }
}

// GET /v1/admin/project/detail
export async function getProjectDetail(uuid: string) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {
      'X-Project-UUID': uuid,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get('/v1/admin/project/detail', { headers })
    const result = response.data
    return { success: true, project: result.data as Project }
  } catch (error: any) {
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
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {
      'X-Project-UUID': uuid,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.get('/v1/admin/project/detail/show_dates', {
      headers,
    })
    const result = response.data
    return { success: true, showDates: (result.data || []) as ShowDate[] }
  } catch (error: any) {
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
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    if (projectUuid) {
      headers['X-Project-UUID'] = projectUuid
    }

    const response = await api.get('/v1/admin/project/countries', { headers })
    return { success: true, data: (response.data.data || []) as Country[] }
  } catch (error: any) {
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
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    if (projectUuid) {
      headers['X-Project-UUID'] = projectUuid
    }

    const response = await api.get('/v1/admin/project/nationalities', { headers })
    return { success: true, data: (response.data.data || []) as Nationality[] }
  } catch (error: any) {
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
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    if (projectUuid) {
      headers['X-Project-UUID'] = projectUuid
    }

    const response = await api.get('/v1/admin/project/mobile-prefixes', { headers })
    return { success: true, data: (response.data.data || []) as MobilePrefix[] }
  } catch (error: any) {
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
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    if (projectUuid) {
      headers['X-Project-UUID'] = projectUuid
    }

    const response = await api.get('/v1/admin/project/timezones', { headers })
    return { success: true, data: (response.data.data || []) as Timezone[] }
  } catch (error: any) {
    console.error('Error fetching timezones:', error)
    return { success: false, error: 'Failed to fetch timezones', data: [] }
  }
}

// PUT /v1/admin/project/detail
export async function updateProject(
  projectData: Partial<Project> & { project_uuid: string }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value

    const headers: Record<string, string> = {
      'X-Project-UUID': projectData.project_uuid,
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await api.put('/v1/admin/project/detail', projectData, {
      headers,
    })

    revalidatePath('/admin/projects')
    return { success: true, project: projectData }
  } catch (error: any) {
    console.error('Error updating project:', error)
    const errMsg = error.response?.data?.message || 'Failed to update project'
    return { success: false, error: errMsg }
  }
}
