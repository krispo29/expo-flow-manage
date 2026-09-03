'use server'

import api, { getErrorMessage } from '@/lib/api'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export type HourlyTrafficPoint = {
  hour: string
  label: string
  scans: number
}

export type LeadScannerUsage = {
  startDate: string
  endDate: string
  overall: Array<{
    companyName: string
    totalScanned: number
    totalContact: number
  }>
  hourlyTraffic?: HourlyTrafficPoint[]
  peakTime?: string
}

export type LeadScannerUsageResult =
  | { success: true; data: LeadScannerUsage }
  | { success: false; error: string }

export type LeadScannerExportResult =
  | { success: true; bytes: number[]; filename: string }
  | { success: false; error: string }

async function getAdminProjectHeaders(projectId?: string) {
  const auth = await getServerAuthContext()
  if (auth?.userRole !== 'ADMIN') throw new Error('Unauthorized')
  if (!projectId) throw new Error('Select a project to view Lead Scanner usage')
  if (!(await verifyProjectAccess(projectId))) throw new Error(`Unauthorized: Access denied to project ${projectId}`)

  return requireServerAuthHeaders({ projectUuid: projectId })
}

export async function getLeadScannerUsage(projectId?: string): Promise<LeadScannerUsageResult> {
  try {
    const headers = await getAdminProjectHeaders(projectId)
    const response = await api.get('/v1/admin/project/lead-scanner/usage', { headers })
    const data = response.data?.data ?? {}

    const hourlyTraffic = Array.isArray(data.hourly_traffic)
      ? data.hourly_traffic.map((item: {
          hour?: string
          label?: string
          scans?: number
          total_scanned?: number
        }) => ({
          hour: item.hour ?? '',
          label: item.label ?? item.hour ?? '',
          scans: item.scans ?? item.total_scanned ?? 0,
        }))
      : undefined

    return {
      success: true,
      data: {
        startDate: data.start_date ?? '',
        endDate: data.end_date ?? '',
        overall: (data.overall ?? []).map((item: {
          company_name?: string
          total_scanned?: number
          total_contact?: number
        }) => ({
          companyName: item.company_name ?? '-',
          totalScanned: item.total_scanned ?? 0,
          totalContact: item.total_contact ?? 0,
        })),
        ...(hourlyTraffic ? { hourlyTraffic } : {}),
        ...(data.peak_time ? { peakTime: data.peak_time } : {}),
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function exportLeadScannerUsage(projectId?: string): Promise<LeadScannerExportResult> {
  try {
    const headers = await getAdminProjectHeaders(projectId)
    const response = await api.get('/v1/admin/project/lead-scanner/export-excel-usage', {
      headers,
      responseType: 'arraybuffer',
    })
    const disposition = response.headers['content-disposition'] ?? ''
    const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? 'lead-scanner-usage.xlsx'

    return { success: true, bytes: Array.from(new Uint8Array(response.data)), filename }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
