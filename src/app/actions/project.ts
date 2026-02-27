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
    return { success: true, projects: (result.data || []) as Project[] }
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    console.error('Error details:', error.response?.data)

    // If token is expired/invalid, return 'key incorrect' so the layout can redirect
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
