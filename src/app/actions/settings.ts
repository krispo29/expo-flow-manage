'use server'

import { mockService, SystemSettings, InvitationCode, Project } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

// --- General Settings ---
export async function getSettings() {
  try {
    const settings = await mockService.getSettings()
    return { success: true, settings }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return { error: 'Failed to fetch settings' }
  }
}

export async function updateSettings(formData: FormData) {
  try {
    const siteUrl = formData.get('siteUrl') as string
    const eventTitle = formData.get('eventTitle') as string
    const eventSubtitle = formData.get('eventSubtitle') as string
    const eventDateStr = formData.get('eventDate') as string
    const cutoffDateStr = formData.get('cutoffDate') as string

    const updateData: Partial<SystemSettings> = {
      siteUrl,
      eventTitle,
      eventSubtitle,
    }

    if (eventDateStr) {
      updateData.eventDate = new Date(eventDateStr)
    }
    
    if (cutoffDateStr) {
      updateData.cutoffDate = new Date(cutoffDateStr)
    }

    await mockService.updateSettings(updateData)

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { error: 'Failed to update settings' }
  }
}

// --- Rooms ---
export async function addRoom(roomName: string) {
    try {
        const settings = await mockService.getSettings();
        const rooms = settings.rooms || [];
        if (!rooms.includes(roomName)) {
            await mockService.updateSettings({ rooms: [...rooms, roomName] });
        }
        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to add room' }
    }
}

export async function deleteRoom(roomName: string) {
    try {
        const settings = await mockService.getSettings();
        const rooms = settings.rooms || [];
        await mockService.updateSettings({ rooms: rooms.filter(r => r !== roomName) });
        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
        return { error: 'Failed to delete room' }
    }
}

// --- Invitation Codes ---
export async function getInvitationCodes() {
  try {
    const codes = await mockService.getInvitationCodes()
    return { success: true, codes }
  } catch (error) {
    return { error: 'Failed to fetch invitation codes' }
  }
}

export async function createInvitationCode(formData: FormData) {
  try {
    const companyName = formData.get('companyName') as string
    const code = formData.get('code') as string

    await mockService.createInvitationCode({
      companyName,
      code
    })

    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to create invitation code' }
  }
}

export async function deleteInvitationCode(id: string) {
  try {
    await mockService.deleteInvitationCode(id)
    revalidatePath('/admin/settings')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to delete invitation code' }
  }
}

// --- Events (Projects) ---
// Note: We might need to move this to project actions if we want full separation, but for "settings" context it's fine here to wrap it or import from project logic. 
// However, mockService has createProject.
export async function createProject(formData: FormData) {
    try {
        const name = formData.get('name') as string
        const description = formData.get('description') as string
        
        await mockService.createProject({
            name,
            description
        })
        revalidatePath('/admin/settings')
        return { success: true }
    } catch (error) {
         return { error: 'Failed to create project' }
    }
}

// We don't have deleteProject in mockService yet, let's assume update is enough or user wants CRUD
