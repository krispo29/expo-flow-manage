'use server'

import api, { getErrorMessage } from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import { revalidatePath } from 'next/cache'
import { requireBusinessMatchingEnabled } from '@/lib/features'


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

export interface FailedCampaignRecord {
  uuid: string
  name: string
  contact_info: string
}

export interface BMVisitorCampaignStatusResponse {
  status: string
  campaign: BMVisitorCampaignData | null
  failed_logs?: FailedCampaignRecord[]
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
  requireBusinessMatchingEnabled(projectUuid || '')
  return requireServerAuthHeaders({ projectUuid })
}

export async function getBMVisitorCampaignStatus(projectId: string) {


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

export async function sendTestBMVisitorCampaign(projectId: string, email: string) {
  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.post<ApiResponse<void>>(
      `/v1/admin/project/business_matching_visitor_ready_campaign/send_test?project_uuid=${projectId}`,
      { email },
      { headers }
    )
    return { success: true, message: response.data.message || 'Test email sent successfully' }
  } catch (error: unknown) {
    console.error('Error sending test BM visitor campaign email:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function retryFailedBMVisitorCampaign(projectId: string) {
  try {
    const headers = await getAuthHeaders(projectId)
    const response = await api.post<ApiResponse<{ retried_count: number }>>(
      `/v1/admin/project/business_matching_visitor_ready_campaign/retry_failed?project_uuid=${projectId}`,
      {},
      { headers }
    )
    return { success: true, count: response.data.data.retried_count, message: response.data.message || 'Successfully queued failed emails for retry' }
  } catch (error: unknown) {
    console.error('Error retrying failed BM visitor campaign emails:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
