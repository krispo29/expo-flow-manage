'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

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
  created_at: string
  updated_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://expoflow-api.thedeft.co'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

// GET /v1/admin/projects
export async function getProjects() {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/v1/admin/projects`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, projects: (result.data || []) as Project[] }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects', projects: [] as Project[] }
  }
}

// GET /v1/admin/projects/:uuid
export async function getProjectDetail(uuid: string) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/v1/admin/projects/${uuid}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, project: result.data as Project }
  } catch (error) {
    console.error('Error fetching project detail:', error)
    return { success: false, error: 'Failed to fetch project detail' }
  }
}

// PUT /v1/admin/projects
export async function updateProject(projectData: Partial<Project> & { project_uuid: string }) {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_URL}/v1/admin/projects`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(projectData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `${response.status}: ${response.statusText}`)
    }

    revalidatePath('/admin/projects')
    return { success: true, project: projectData }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: 'Failed to update project' }
  }
}
