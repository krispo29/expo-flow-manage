'use server'

import { revalidatePath } from 'next/cache'
import api from '@/lib/api'

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
  created_at: string
  updated_at: string
}

// GET /v1/admin/projects (No X-Project-UUID header)
export async function getProjects() {
  try {
    const response = await api.get('/v1/admin/projects')
    const result = response.data
    return { success: true, projects: (result.data || []) as Project[] }
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects', projects: [] as Project[] }
  }
}

// GET /v1/admin/project/detail
export async function getProjectDetail(uuid: string) {
  try {
    const response = await api.get('/v1/admin/project/detail', {
      headers: { 'X-Project-UUID': uuid }
    })
    const result = response.data
    return { success: true, project: result.data as Project }
  } catch (error: any) {
    console.error('Error fetching project detail:', error)
    return { success: false, error: 'Failed to fetch project detail' }
  }
}

// GET /v1/admin/project/show-dates
export async function getProjectShowDates(uuid: string) {
  try {
    const response = await api.get('/v1/admin/project/show-dates', {
      headers: { 'X-Project-UUID': uuid }
    })
    const result = response.data
    return { success: true, showDates: (result.data || []) as string[] }
  } catch (error: any) {
    console.error('Error fetching project show dates:', error)
    return { success: false, error: 'Failed to fetch show dates', showDates: [] as string[] }
  }
}

// PUT /v1/admin/project/detail
export async function updateProject(projectData: Partial<Project> & { project_uuid: string }) {
  try {
    const response = await api.put('/v1/admin/project/detail', projectData, {
      headers: { 'X-Project-UUID': projectData.project_uuid }
    })
    
    revalidatePath('/admin/projects')
    return { success: true, project: projectData }
  } catch (error: any) {
    console.error('Error updating project:', error)
    const errMsg = error.response?.data?.message || 'Failed to update project'
    return { success: false, error: errMsg }
  }
}
