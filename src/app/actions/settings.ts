'use server'

import { mockService } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getSystemSettings() {
  try {
    const settings = await mockService.getSettings()
    return { success: true, data: settings }
  } catch (error) {
    console.error('Error getting settings:', error)
    return { error: 'Failed to fetch settings' }
  }
}

export async function updateSystemSettings(formData: FormData) {
  try {
    const eventTitle = formData.get('eventTitle') as string
    const eventSubtitle = formData.get('eventSubtitle') as string
    const siteUrl = formData.get('siteUrl') as string
    const eventDateStr = formData.get('eventDate') as string
    const cutoffDateStr = formData.get('cutoffDate') as string

    const updated = await mockService.updateSettings({
      eventTitle,
      eventSubtitle,
      siteUrl,
      eventDate: new Date(eventDateStr),
      cutoffDate: new Date(cutoffDateStr)
    })

    revalidatePath('/admin/settings')
    return { success: true, data: updated }
  } catch (error) {
    console.error('Error updating settings:', error)
    return { error: 'Failed to update settings' }
  }
}
