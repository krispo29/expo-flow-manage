'use server'

import { cookies } from 'next/headers'
import api, { getErrorMessage } from '@/lib/api'
import type { Invitation } from './settings'

async function getOrganizerAuthHeaders() {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  const projectUuid = cookieStore.get('project_uuid')?.value

  return {
    projectUuid,
    headers: {
      ...(projectUuid && { 'X-Project-UUID': projectUuid }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  }
}

export async function getOrganizerInvitations() {
  try {
    const { headers, projectUuid } = await getOrganizerAuthHeaders()
    const response = await api.get('/v1/organizer/invitations', {
      headers,
      params: { project_uuid: projectUuid },
    })

    return {
      success: true,
      invitations: (response.data?.data || []) as Invitation[],
    }
  } catch (error: unknown) {
    console.error('Error fetching organizer invitations:', error)
    return {
      success: false,
      error: getErrorMessage(error),
      invitations: [] as Invitation[],
    }
  }
}

export async function exportOrganizerInvitations(projectId?: string) {
  try {
    const { headers } = await getOrganizerAuthHeaders()
    if (projectId) {
      Object.assign(headers, { 'X-Project-UUID': projectId })
    }

    const response = await api.get('/v1/admin/project/invitations/export-excel', {
      headers,
      responseType: 'arraybuffer',
    })

    return {
      success: true,
      data: new Uint8Array(response.data),
      contentType: response.headers['content-type'],
    }
  } catch (error: unknown) {
    console.error('Error exporting organizer invitations:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
