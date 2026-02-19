'use server'

import { mockService } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getOrganizers() {
  try {
    const organizers = await mockService.getOrganizers()
    return { success: true, data: organizers }
  } catch (error) {
    console.error('Error fetching organizers:', error)
    return { error: 'Failed to fetch organizers' }
  }
}

export async function createOrganizer(formData: FormData) {
  try {
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const projectId = formData.get('projectId') as string
    const role = formData.get('role') as string || 'ORGANIZER' // Default to ORGANIZER if not specified

    // Check if user already exists in mock data (simulated)
    const existingUser = await mockService.findUserByUsername(username)
    if (existingUser) {
      return { error: 'Username already exists' }
    }
    
    // In mock service, we separate Auth User and Organizer Record usually, 
    // but for simplicity in this refactor, let's treat Organizer list as the source of truth for display
    // and assume an associated User would be created in a real app.
    
    await mockService.createOrganizer({
        username,
        email,
        projectId,
        role
    })

    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error) {
    console.error('Error creating organizer:', error)
    return { error: 'Failed to create organizer' }
  }
}

export async function updateOrganizer(id: string, formData: FormData) {
  try {
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    // Password update logic omitted for mock simplicity as we don't store passwords in Organizer model in mock yet
    // const password = formData.get('password') as string 

    await mockService.updateOrganizer(id, {
        username,
        email
    })

    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error) {
    console.error('Error updating organizer:', error)
    return { error: 'Failed to update organizer' }
  }
}

export async function deleteOrganizer(id: string) {
  try {
    await mockService.deleteOrganizer(id)
    revalidatePath('/admin/organizers')
    return { success: true }
  } catch (error) {
    console.error('Error deleting organizer:', error)
    return { error: 'Failed to delete organizer' }
  }
}

export async function getOrganizerProjectAction(username: string) {
  try {
    const organizer = await mockService.findOrganizerByUsername(username)
    if (organizer?.projectId) {
      return { success: true, projectId: organizer.projectId }
    }
    
    // Fallback: get first available project if organizer doesn't have one assigned or not found in list
    const projects = await mockService.getProjects()
    if (projects.length > 0) {
      return { success: true, projectId: projects[0].id }
    }

    return { error: 'No projects available' }
  } catch (error) {
    console.error('Error getting organizer project:', error)
    return { error: 'Failed to get project' }
  }
}
