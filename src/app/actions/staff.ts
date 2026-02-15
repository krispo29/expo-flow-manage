'use server'

import { mockService, Staff } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getStaffByExhibitorId(exhibitorId: string) {
  try {
    const staff = await mockService.getStaffByExhibitorId(exhibitorId)
    return { success: true, staff }
  } catch (error) {
    console.error('Error fetching staff:', error)
    return { error: 'Failed to fetch staff' }
  }
}

export async function createStaff(data: Omit<Staff, 'id' | 'createdAt'>) {
  try {
    const staff = await mockService.createStaff(data)
    revalidatePath('/admin/exhibitors')
    return { success: true, staff }
  } catch (error) {
    console.error('Error creating staff:', error)
    return { error: 'Failed to create staff' }
  }
}

export async function updateStaff(id: string, data: Partial<Omit<Staff, 'id' | 'createdAt'>>) {
  try {
    const staff = await mockService.updateStaff(id, data)
    revalidatePath('/admin/exhibitors')
    return { success: true, staff }
  } catch (error) {
    console.error('Error updating staff:', error)
    return { error: 'Failed to update staff' }
  }
}

export async function deleteStaff(id: string) {
  try {
    await mockService.deleteStaff(id)
    revalidatePath('/admin/exhibitors')
    return { success: true }
  } catch (error) {
    console.error('Error deleting staff:', error)
    return { error: 'Failed to delete staff' }
  }
}

export async function sendStaffCredentials(staffId: string, targetEmail?: string) {
  try {
    const staff = await mockService.getStaffById(staffId)
    if (!staff) throw new Error('Staff not found')
    
    const emailToUse = targetEmail || staff.email
    
    // Mock sending email
    console.log(`Sending credentials to: ${emailToUse} (Staff: ${staff.firstName} ${staff.lastName})`)
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  } catch (error) {
    console.error('Error sending credentials:', error)
    return { error: 'Failed to send credentials' }
  }
}
