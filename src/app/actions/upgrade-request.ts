'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import type { ReviewUpgradeRequestPayload } from '@/lib/upgrade-requests'

export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface UpgradeTriggerDetail {
  question_uuid: string
  question_text: string
  trigger_option_value: string
  option_label: string
  user_answer: string
}

export interface UpgradeRequest {
  request_uuid: string
  project_uuid: string
  registration_uuid: string
  trigger_uuid: string
  question_uuid: string
  trigger_option_value: string
  from_type_code: string
  suggested_type_code: string
  approved_type_code: string
  status: UpgradeRequestStatus
  reviewed_by: string
  reviewed_at: string
  note: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  company_name: string
  registration_code: string
  question_text: string
  option_label: string
  trigger_details?: UpgradeTriggerDetail[]
}

async function getAuthHeaders(projectUuid: string) {
  await requireProjectContext(projectUuid)
  return requireServerAuthHeaders({ projectUuid })
}

export async function getUpgradeRequests(projectUuid: string) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/upgrade-requests', {
      headers,
    })

    return {
      success: true as const,
      data: (response.data?.data || []) as UpgradeRequest[],
    }
  } catch (error: unknown) {
    console.error('Error fetching upgrade requests:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to fetch upgrade requests',
      data: [] as UpgradeRequest[],
    }
  }
}

export async function reviewUpgradeRequest(
  projectUuid: string,
  payload: ReviewUpgradeRequestPayload
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.post(
      '/v1/admin/project/upgrade-requests/review',
      payload,
      { headers }
    )

    revalidatePath('/admin/upgrade-requests')
    revalidatePath('/admin/participants')

    return { success: true as const, data: response.data?.data }
  } catch (error: unknown) {
    console.error('Error reviewing upgrade request:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to review upgrade request',
    }
  }
}
