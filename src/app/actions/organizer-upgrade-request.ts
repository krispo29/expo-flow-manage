'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireOrganizer, requireProjectContext } from '@/lib/authorization'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import type { ReviewUpgradeRequestPayload } from '@/lib/upgrade-requests'
import type { UpgradeRequest } from '@/app/actions/upgrade-request'

async function getOrganizerAuthHeaders(projectUuid: string) {
  await requireOrganizer()
  await requireProjectContext(projectUuid)
  return requireServerAuthHeaders({ projectUuid })
}

export async function getOrganizerUpgradeRequests(projectUuid: string) {
  try {
    const headers = await getOrganizerAuthHeaders(projectUuid)
    const response = await api.get('/v1/organizer/upgrade-requests', { headers })

    return {
      success: true as const,
      data: (response.data?.data || []) as UpgradeRequest[],
    }
  } catch (error: unknown) {
    console.error('Error fetching organizer upgrade requests:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to fetch upgrade requests',
      data: [] as UpgradeRequest[],
    }
  }
}

export async function reviewOrganizerUpgradeRequest(
  projectUuid: string,
  payload: ReviewUpgradeRequestPayload
) {
  try {
    const headers = await getOrganizerAuthHeaders(projectUuid)
    const response = await api.post(
      '/v1/organizer/upgrade-requests/review',
      payload,
      { headers }
    )

    revalidatePath('/organizer/upgrade-requests')
    revalidatePath('/organizer/participants')

    return { success: true as const, data: response.data?.data }
  } catch (error: unknown) {
    console.error('Error reviewing organizer upgrade request:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to review upgrade request',
    }
  }
}
