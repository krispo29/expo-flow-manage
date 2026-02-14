'use server'

import { mockService } from '@/lib/mock-service'

export async function getProjects() {
  try {
    const projects = await mockService.getProjects()
    return { success: true, projects }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { error: 'Failed to fetch projects' }
  }
}

export async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name) {
    return { error: 'Project name is required' }
  }

  try {
    const project = await mockService.createProject({
        name,
        description,
    })
    return { success: true, project }
  } catch (error) {
    console.error('Error creating project:', error)
    return { error: 'Failed to create project' }
  }
}
