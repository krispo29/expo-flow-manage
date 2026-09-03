'use server'

import api, { getErrorMessage } from '@/lib/api'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export type CompanyUsageItem = {
  companyName: string
  totalScanned: number
  totalContact: number
}

export type LeadScannerDay = {
  dayLabel: string
  date?: string
  overall: CompanyUsageItem[]
}

export type HourlyTrafficPoint = {
  hour: string
  label: string
  scans: number
}

export type LeadScannerUsage = {
  startDate: string
  endDate: string
  overall: CompanyUsageItem[]
  days?: LeadScannerDay[]
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

    let parsedDays: LeadScannerDay[] = []
    if (Array.isArray(data.days) && data.days.length > 0) {
      const first = data.days[0]
      if (
        first &&
        typeof first === 'object' &&
        ('companies' in first ||
          'overall' in first ||
          'data' in first ||
          'items' in first ||
          'usage' in first ||
          'usages' in first)
      ) {
        parsedDays = data.days.map((d: any) => ({
          dayLabel: d.day_label ?? d.label ?? d.date ?? 'Day',
          date: d.date,
          overall: (d.companies ?? d.overall ?? d.data ?? d.items ?? d.usage ?? d.usages ?? []).map(
            (item: any) => ({
              companyName: item.company_name ?? item.companyName ?? '-',
              totalScanned: item.total_scanned ?? item.totalScanned ?? 0,
              totalContact: item.total_contact ?? item.totalContact ?? 0,
            }),
          ),
        }))
      } else if (first && typeof first === 'object' && ('company_name' in first || 'companyName' in first)) {
        const dayMap = new Map<string, CompanyUsageItem[]>()
        for (const item of data.days) {
          const label = item.day_label ?? item.label ?? item.date ?? 'Day'
          if (!dayMap.has(label)) {
            dayMap.set(label, [])
          }
          dayMap.get(label)!.push({
            companyName: item.company_name ?? item.companyName ?? '-',
            totalScanned: item.total_scanned ?? item.totalScanned ?? 0,
            totalContact: item.total_contact ?? item.totalContact ?? 0,
          })
        }
        parsedDays = Array.from(dayMap.entries()).map(([dayLabel, overall]) => ({
          dayLabel,
          overall,
        }))
      } else if (first && typeof first === 'object' && 'day_label' in first) {
        parsedDays = data.days.map((d: any) => ({
          dayLabel: d.day_label ?? d.label ?? d.date ?? 'Day',
          date: d.date,
          overall: (d.companies ?? d.overall ?? d.data ?? d.items ?? []).map((item: any) => ({
            companyName: item.company_name ?? item.companyName ?? '-',
            totalScanned: item.total_scanned ?? item.totalScanned ?? 0,
            totalContact: item.total_contact ?? item.totalContact ?? 0,
          })),
        }))
      }
    }

    let overall: CompanyUsageItem[] = []
    if (Array.isArray(data.overall) && data.overall.length > 0) {
      overall = data.overall.map((item: {
        company_name?: string
        total_scanned?: number
        total_contact?: number
      }) => ({
        companyName: item.company_name ?? '-',
        totalScanned: item.total_scanned ?? 0,
        totalContact: item.total_contact ?? 0,
      }))
    } else if (parsedDays.length > 0) {
      const companyMap = new Map<string, { totalScanned: number; totalContact: number }>()
      for (const day of parsedDays) {
        for (const item of day.overall) {
          const existing = companyMap.get(item.companyName) ?? { totalScanned: 0, totalContact: 0 }
          companyMap.set(item.companyName, {
            totalScanned: existing.totalScanned + item.totalScanned,
            totalContact: existing.totalContact + item.totalContact,
          })
        }
      }
      overall = Array.from(companyMap.entries()).map(([companyName, stats]) => ({
        companyName,
        totalScanned: stats.totalScanned,
        totalContact: stats.totalContact,
      }))
    }

    return {
      success: true,
      data: {
        startDate: data.start_date ?? '',
        endDate: data.end_date ?? '',
        overall,
        ...(parsedDays.length > 0 ? { days: parsedDays } : {}),
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
