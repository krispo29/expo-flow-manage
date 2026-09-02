'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireOrganizer } from '@/lib/authorization'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import type { QuotaRequest } from '@/app/actions/quota-request'

async function getOrganizerAuthHeaders() {
  await requireOrganizer()
  return requireServerAuthHeaders({ includeProjectUuid: false })
}

export async function getOrganizerQuotaRequests() {
  try {
    const response = await api.get('/v1/organizer/quota-requests', {
      headers: await getOrganizerAuthHeaders(),
    })

    return { success: true as const, data: (response.data?.data || []) as QuotaRequest[] }
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error), data: [] as QuotaRequest[] }
  }
}

export async function approveOrganizerQuotaRequest(requestUuid: string) {
  return updateOrganizerQuotaRequest(requestUuid, 'approve')
}

export async function rejectOrganizerQuotaRequest(requestUuid: string, note = '') {
  return updateOrganizerQuotaRequest(requestUuid, 'reject', { note })
}

export async function undoOrganizerQuotaRequest(requestUuid: string) {
  return updateOrganizerQuotaRequest(requestUuid, 'undo')
}

async function updateOrganizerQuotaRequest(
  requestUuid: string,
  action: 'approve' | 'reject' | 'undo',
  data: Record<string, string> = {}
) {
  try {
    await api.put(`/v1/organizer/quota-requests/${requestUuid}/${action}`, data, {
      headers: await getOrganizerAuthHeaders(),
    })
    revalidatePath('/organizer/quota-requests')
    return { success: true as const }
  } catch (error: unknown) {
    return { success: false as const, error: getErrorMessage(error) }
  }
}
