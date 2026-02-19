'use server'

import { mockService, Exhibitor } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getExhibitors(projectId: string) {
  try {
    const exhibitors = await mockService.getExhibitors(projectId)
    return { success: true, exhibitors }
  } catch (error) {
    console.error('Error fetching exhibitors:', error)
    return { error: 'Failed to fetch exhibitors' }
  }
}

export async function createExhibitor(data: Omit<Exhibitor, 'id' | 'createdAt'>) {
  try {
    const exhibitor = await mockService.createExhibitor(data)
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor }
  } catch (error) {
    console.error('Error creating exhibitor:', error)
    return { error: 'Failed to create exhibitor' }
  }
}

export async function updateExhibitor(id: string, data: Partial<Omit<Exhibitor, 'id' | 'createdAt'>>) {
  try {
    const exhibitor = await mockService.updateExhibitor(id, data)
    revalidatePath('/admin/exhibitors')
    return { success: true, exhibitor }
  } catch (error) {
    console.error('Error updating exhibitor:', error)
    return { error: 'Failed to update exhibitor' }
  }
}

export async function deleteExhibitor(id: string) {
  try {
    await mockService.deleteExhibitor(id)
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error) {
    console.error('Error deleting exhibitor:', error)
    return { error: 'Failed to delete exhibitor' }
  }
}

export async function getExhibitorById(id: string) {
  try {
    const exhibitor = await mockService.getExhibitorById(id)
    return { success: true, exhibitor }
  } catch (error) {
    console.error('Error fetching exhibitor:', error)
    return { error: 'Failed to fetch exhibitor' }
  }
}

export async function generateInviteCode(id: string) {
  try {
    // In a real app, generate a unique code and save it
    // For mock, we'll just return a success with a fake code update
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()
    await mockService.updateExhibitor(id, { inviteCode })
    revalidatePath('/admin/exhibitors')
    return { success: true, inviteCode }
  } catch (error) {
    console.error('Error generating invite code:', error)
    return { error: 'Failed to generate invite code' }
  }
}

export async function sendExhibitorCredentials(id: string, targetEmail?: string) {
  try {
    const exhibitor = await mockService.getExhibitorById(id)
    if (!exhibitor) throw new Error('Exhibitor not found')
    
    const emailToUse = targetEmail || exhibitor.email
    
    // Mock sending email
    console.log(`Sending credentials to: ${emailToUse} (Exhibitor: ${exhibitor.companyName})`)
    console.log(`Username: ${exhibitor.registrationId}, Password: ${exhibitor.password}`)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  } catch (error) {
    console.error('Error sending credentials:', error)
    return { error: 'Failed to send credentials' }
  }
}

export async function getExhibitorProjectAction(registrationId: string) {
  try {
    const exhibitor = await mockService.findExhibitorByRegistrationId(registrationId)
    if (exhibitor?.projectId) {
      return { success: true, projectId: exhibitor.projectId }
    }
    
    // Fallback: get first available project if exhibitor doesn't have one assigned
    const projects = await mockService.getProjects()
    if (projects.length > 0) {
      return { success: true, projectId: projects[0].id }
    }

    return { error: 'No projects available' }
  } catch (error) {
    console.error('Error getting exhibitor project:', error)
    return { error: 'Failed to get project' }
  }
}
