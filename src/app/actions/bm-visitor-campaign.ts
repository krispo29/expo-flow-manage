'use server'

import api, { getErrorMessage } from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import { revalidatePath } from 'next/cache'

const THAILAB2026_PROJECT_ID = '07626a19-001d-4675-addd-3a92e3f46d47'

export interface BMVisitorCampaignData {
  campaign_uuid: string
  project_uuid: string
  event_uuid: string
  status: 'idle' | 'active' | 'paused' | 'completed'
  batch_size: number
  interval_minutes: number
  total_eligible: number
  total_sent: number
  total_failed: number
  last_run_at: string | null
  next_run_at: string | null
}

export interface BMVisitorCampaignStatusResponse {
  status: string
  campaign: BMVisitorCampaignData | null
}

export interface BMVisitorCampaignBatchResponse {
  status: string
  message: string
  sent: number
  failed: number
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

async function getAuthHeaders(projectUuid?: string) {
  return requireServerAuthHeaders({ projectUuid })
}

export async function getBMVisitorCampaignStatus(projectId: string) {
  if (projectId !== THAILAB2026_PROJECT_ID) {
    return { success: false, error: 'Campaign is only available for THAILAB2026' }
  }

  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.get<ApiResponse<BMVisitorCampaignStatusResponse>>(
      `/v1/admin/project/business_matching_visitor_ready_campaign/status?project_uuid=${projectId}`,
      { headers }
    )
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    console.error('Error fetching BM visitor campaign status:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function startBMVisitorCampaign(projectId: string, batchSize = 50, intervalMinutes = 10) {
  if (projectId !== THAILAB2026_PROJECT_ID) {
    return { success: false, error: 'Campaign is only available for THAILAB2026' }
  }

  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.post<ApiResponse<BMVisitorCampaignStatusResponse>>(
      '/v1/admin/project/business_matching_visitor_ready_campaign/start',
      {
        project_uuid: projectId,
        batch_size: batchSize,
        interval_minutes: intervalMinutes,
      },
      { headers }
    )
    revalidatePath('/admin/participants')
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    console.error('Error starting BM visitor campaign:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function pauseBMVisitorCampaign(projectId: string) {
  if (projectId !== THAILAB2026_PROJECT_ID) {
    return { success: false, error: 'Campaign is only available for THAILAB2026' }
  }

  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.post<ApiResponse<{ status: string }>>(
      '/v1/admin/project/business_matching_visitor_ready_campaign/pause',
      { project_uuid: projectId },
      { headers }
    )
    revalidatePath('/admin/participants')
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    console.error('Error pausing BM visitor campaign:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function triggerBMVisitorCampaignBatchNow(projectId: string) {
  if (projectId !== THAILAB2026_PROJECT_ID) {
    return { success: false, error: 'Campaign is only available for THAILAB2026' }
  }

  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.post<ApiResponse<BMVisitorCampaignBatchResponse>>(
      '/v1/admin/project/business_matching_visitor_ready_campaign/trigger_batch',
      { project_uuid: projectId },
      { headers }
    )
    revalidatePath('/admin/participants')
    return { success: true, data: response.data.data }
  } catch (error: unknown) {
    console.error('Error triggering BM visitor campaign batch:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
