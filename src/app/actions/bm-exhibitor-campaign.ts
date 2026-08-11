'use server'

import api from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'
import { requireBusinessMatchingEnabled } from '@/lib/features'

async function getCampaignAuthHeaders(projectId: string) {
  requireBusinessMatchingEnabled(projectId)
  return requireServerAuthHeaders({ projectUuid: projectId })
}

export interface BMExhibitorReadyCampaignStatus {
  campaign_uuid?: string
  project_uuid?: string
  event_uuid?: string
  status: 'idle' | 'active' | 'paused' | 'completed' | string
  batch_size: number
  interval_minutes: number
  total_eligible: number
  total_sent: number
  total_failed: number
  last_run_at?: string
  next_run_at?: string
  // PascalCase fallbacks
  CampaignUUID?: string
  ProjectUUID?: string
  EventUUID?: string
  Status?: string
  BatchSize?: number
  IntervalMinutes?: number
  TotalEligible?: number
  TotalSent?: number
  TotalFailed?: number
  LastRunAt?: string
  NextRunAt?: string
}

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface FailedCampaignRecord {
  uuid: string
  name: string
  contact_info: string
}

export interface BMExhibitorCampaignStatusResponse {
  campaign: BMExhibitorReadyCampaignStatus | null
  failed_logs?: FailedCampaignRecord[]
}

export async function getBMExhibitorCampaignStatus(projectId: string) {
  try {
    const headers = await getCampaignAuthHeaders(projectId)
    const res = await api.get<ApiResponse<BMExhibitorCampaignStatusResponse | BMExhibitorReadyCampaignStatus>>(
      `/v1/admin/project/business_matching_exhibitor_ready_campaign/status?project_uuid=${projectId}`,
      { headers }
    )
    return { success: true, data: res.data.data }
  } catch (error: any) {
    console.error('Error getting BM Exhibitor campaign status:', error)
    return { success: false, error: error.message || 'Failed to fetch status' }
  }
}

export async function startBMExhibitorCampaign(projectId: string, batchSize = 50, intervalMinutes = 10) {
  try {
    const headers = await getCampaignAuthHeaders(projectId)
    const res = await api.post<ApiResponse<BMExhibitorReadyCampaignStatus>>(
      `/v1/admin/project/business_matching_exhibitor_ready_campaign/start?project_uuid=${projectId}`,
      { batch_size: batchSize, interval_minutes: intervalMinutes },
      { headers }
    )
    return { success: true, data: res.data.data }
  } catch (error: any) {
    console.error('Error starting BM Exhibitor campaign:', error)
    return { success: false, error: error.message || 'Failed to start campaign' }
  }
}

export async function pauseBMExhibitorCampaign(projectId: string) {
  try {
    const headers = await getCampaignAuthHeaders(projectId)
    const res = await api.post<ApiResponse<BMExhibitorReadyCampaignStatus>>(
      `/v1/admin/project/business_matching_exhibitor_ready_campaign/pause?project_uuid=${projectId}`,
      {},
      { headers }
    )
    return { success: true, data: res.data.data }
  } catch (error: any) {
    console.error('Error pausing BM Exhibitor campaign:', error)
    return { success: false, error: error.message || 'Failed to pause campaign' }
  }
}

export async function triggerBMExhibitorCampaignBatchNow(projectId: string) {
  try {
    const headers = await getCampaignAuthHeaders(projectId)
    const res = await api.post<ApiResponse<{ sent: number; failed: number; campaign: BMExhibitorReadyCampaignStatus }>>(
      `/v1/admin/project/business_matching_exhibitor_ready_campaign/trigger_batch?project_uuid=${projectId}`,
      {},
      { headers, timeout: 120000 }
    )
    return { success: true, data: res.data.data }
  } catch (error: any) {
    console.error('Error triggering BM Exhibitor campaign batch:', error)
    return { success: false, error: error.message || 'Failed to trigger batch' }
  }
}

export async function sendTestBMExhibitorCampaign(projectId: string, email: string) {
	try {
		const headers = await getCampaignAuthHeaders(projectId)
		const res = await api.post<ApiResponse<void>>(
			`/v1/admin/project/business_matching_exhibitor_ready_campaign/send_test?project_uuid=${projectId}`,
			{ email },
			{ headers }
		)
		return { success: true, message: res.data.message || 'Test email sent successfully' }
	} catch (error: any) {
		console.error('Error sending test BM Exhibitor campaign email:', error)
		return { success: false, error: error.message || 'Failed to send test email' }
	}
}

export async function retryFailedBMExhibitorCampaign(projectId: string) {
	try {
		const headers = await getCampaignAuthHeaders(projectId)
		const res = await api.post<ApiResponse<{ retried_count: number }>>(
			`/v1/admin/project/business_matching_exhibitor_ready_campaign/retry_failed?project_uuid=${projectId}`,
			{},
			{ headers }
		)
		return { success: true, count: res.data.data.retried_count, message: res.data.message || 'Successfully queued failed emails for retry' }
	} catch (error: any) {
		console.error('Error retrying failed BM Exhibitor campaign emails:', error)
		return { success: false, error: error.message || 'Failed to retry failed emails' }
	}
}
