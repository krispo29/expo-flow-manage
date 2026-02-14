'use server'

import { mockService } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getConferences(projectId: string) {
  try {
    const conferences = await mockService.getConferences(projectId)
    return { success: true, data: conferences }
  } catch (error) {
    console.error('Error fetching conferences:', error)
    return { error: 'Failed to fetch conferences' }
  }
}

export async function getConferenceById(id: string) {
  try {
    const conference = await mockService.getConferenceById(id)
    return { success: true, conference }
  } catch (error) {
    console.error('Error fetching conference:', error)
    return { error: 'Failed to fetch conference' }
  }
}

export async function createConference(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string
    const topic = formData.get('topic') as string
    const dateStr = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const room = formData.get('room') as string
    const capacityVal = formData.get('capacity') as string
    const detail = formData.get('detail') as string
    const speakerInfo = formData.get('speakerInfo') as string
    const isPublic = formData.get('isPublic') === 'on'
    const showOnReg = formData.get('showOnReg') === 'on'
    const allowPreReg = formData.get('allowPreReg') === 'on'
    
    await mockService.createConference({
        projectId,
        topic,
        date: new Date(dateStr),
        startTime,
        endTime,
        room,
        capacity: capacityVal ? parseInt(capacityVal, 10) : undefined,
        detail,
        speakerInfo,
        photoUrl: '', // simplified
        isPublic,
        showOnReg,
        allowPreReg
    })

    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error) {
    console.error('Error creating conference:', error)
    return { error: 'Failed to create conference' }
  }
}

export async function updateConference(id: string, formData: FormData) {
  try {
    const topic = formData.get('topic') as string
    const dateStr = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const room = formData.get('room') as string
    const capacityVal = formData.get('capacity') as string
    const detail = formData.get('detail') as string
    const speakerInfo = formData.get('speakerInfo') as string
    const isPublic = formData.get('isPublic') === 'on'
    const showOnReg = formData.get('showOnReg') === 'on'
    const allowPreReg = formData.get('allowPreReg') === 'on'

    await mockService.updateConference(id, {
        topic,
        date: new Date(dateStr),
        startTime,
        endTime,
        room,
        capacity: capacityVal ? parseInt(capacityVal, 10) : undefined,
        detail,
        speakerInfo,
        isPublic,
        showOnReg,
        allowPreReg
    })

    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error) {
    console.error('Error updating conference:', error)
    return { error: 'Failed to update conference' }
  }
}

export async function deleteConference(id: string) {
  try {
    await mockService.deleteConference(id)
    revalidatePath('/admin/conferences')
    return { success: true }
  } catch (error) {
    console.error('Error deleting conference:', error)
    return { error: 'Failed to delete conference' }
  }
}

export async function importConferences(data: any[]) {
  try {
    // Basic validation could go here
    for (const conf of data) {
        await mockService.createConference({
             projectId: conf.projectId,
             topic: conf.topic,
             date: new Date(conf.date),
             startTime: conf.startTime,
             endTime: conf.endTime,
             room: conf.room,
             capacity: conf.capacity,
             detail: conf.detail,
             speakerInfo: conf.speakerInfo,
             isPublic: conf.isPublic,
             showOnReg: conf.showOnReg,
             allowPreReg: conf.allowPreReg
        })
    }
    
    revalidatePath('/admin/conferences')
    return { success: true, count: data.length }
  } catch (error) {
    console.error('Error importing conferences:', error)
    return { error: 'Failed to import conferences' }
  }
}
