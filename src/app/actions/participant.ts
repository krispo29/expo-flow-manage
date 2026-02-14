'use server'

import { mockService } from '@/lib/mock-service'
import { revalidatePath } from 'next/cache'

export async function getParticipants(projectId: string, query?: string, type?: string) {
  try {
    const participants = await mockService.getParticipants(projectId, query, type)
    return { success: true, data: participants }
  } catch (error) {
    console.error('Error fetching participants:', error)
    return { error: 'Failed to fetch participants' }
  }
}

export async function createParticipant(formData: FormData) {
  try {
    const projectId = formData.get('projectId') as string
    const type = formData.get('type') as string
    const code = formData.get('code') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const mobile = formData.get('mobile') as string
    const company = formData.get('company') as string
    const position = formData.get('position') as string
    const room = formData.get('room') as string

    await mockService.createParticipant({
        projectId,
        type,
        code,
        firstName,
        lastName,
        email,
        mobile,
        company,
        position,
        room
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error) {
    console.error('Error creating participant:', error)
    return { error: 'Failed to create participant' }
  }
}

export async function updateParticipant(id: string, formData: FormData) {
  try {
    const type = formData.get('type') as string
    const code = formData.get('code') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const mobile = formData.get('mobile') as string
    const company = formData.get('company') as string
    const position = formData.get('position') as string
    const room = formData.get('room') as string

    await mockService.updateParticipant(id, {
        type,
        code,
        firstName,
        lastName,
        email,
        mobile,
        company,
        position,
        room
    })

    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error) {
    console.error('Error updating participant:', error)
    return { error: 'Failed to update participant' }
  }
}

export async function deleteParticipant(id: string) {
  try {
    await mockService.deleteParticipant(id)
    revalidatePath('/admin/participants')
    return { success: true }
  } catch (error) {
    console.error('Error deleting participant:', error)
    return { error: 'Failed to delete participant' }
  }
}

export async function importParticipants(data: any[]) {
    try {
      const formattedData = data.map(p => ({
        projectId: p.projectId,
        type: p.type || 'INDIVIDUAL',
        code: p.code,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        mobile: p.mobile,
        company: p.company,
        position: p.position,
        room: p.room
      }))

      const count = await mockService.createManyParticipants(formattedData)

      revalidatePath('/admin/participants')
      return { success: true, count }
    } catch (error) {
      console.error('Error importing participants:', error)
      return { error: 'Failed to import participants' }
    }
}

export async function processScannerData(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return { success: false, error: 'File and Project ID are required' };
    }

    const text = await file.text();
    // Split by newlines and filter out empty lines
    const codes = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    let updatedCount = 0;
    for (const code of codes) {
      // Logic: Update attendance if code matches participant
      // In a real database, we might do a bulk update. 
      // With mock, we iterate.
      const participant = await mockService.updateAttendance(code, true);
      if (participant) {
        updatedCount++;
      }
    }
    
    revalidatePath('/admin/participants');
    return { success: true, processed: codes.length, updated: updatedCount };

  } catch (error) {
    console.error('Scanner import error:', error);
    return { success: false, error: 'Failed to process scanner data' };
  }
}
