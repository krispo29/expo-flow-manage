'use server'

import api from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'

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

export async function getBMExhibitorCampaignStatus(projectId: string) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid: projectId })
    const res = await api.get<ApiResponse<BMExhibitorReadyCampaignStatus>>(
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
    const headers = await requireServerAuthHeaders({ projectUuid: projectId })
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
    const headers = await requireServerAuthHeaders({ projectUuid: projectId })
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
    const headers = await requireServerAuthHeaders({ projectUuid: projectId })
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
