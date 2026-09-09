'use server'

import api, { getErrorMessage } from '@/lib/api'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export type CompanyUsageItem = {
  companyName: string
  totalScanned: number
  totalContact: number
  totalExportedContact?: number
  totalDownloadCount?: number
  isDownloaded?: boolean
}

export type LeadScannerDay = {
  day?: number
  dayLabel: string
  date?: string
  totalScanned?: number
  totalContact?: number
  totalExportedContact?: number
  totalDownloadCount?: number
  chart?: TrafficChart
  overall: CompanyUsageItem[]
}

export type HourlyTrafficPoint = {
  date?: string
  hour: number | string
  label: string
  scans: number
}

export type TrafficChart = {
  date?: string
  timezone?: string
  peakHour?: number | string
  peakScans?: number
  data: HourlyTrafficPoint[]
}

type RawTrafficPoint = {
  date?: string
  hour?: number | string
  label?: string
  scans?: number
  total_scanned?: number
}

type RawTrafficChart = {
  date?: string
  timezone?: string
  peakHour?: number | string
  peak_hour?: number | string
  peakScans?: number
  peak_scans?: number
  data?: RawTrafficPoint[]
}

export type LeadScannerUsage = {
  startDate: string
  endDate: string
  totalScanned?: number
  totalContact?: number
  totalExportedContact?: number
  totalDownloadCount?: number
  totalLeadScannerEnabledCount?: number
  overall: CompanyUsageItem[]
  days?: LeadScannerDay[]
  chart?: TrafficChart
  hourlyTraffic?: HourlyTrafficPoint[]
  peakTime?: string
}

export type LeadScannerUsageResult =
  | { success: true; data: LeadScannerUsage }
  | { success: false; error: string }

export type LeadScannerExportResult =
  | { success: true; bytes: number[]; filename: string }
  | { success: false; error: string }

export type DisableAllLeadScannersResult =
  | { success: true }
  | { success: false; error: string }

function mapCompanyUsageItem(item: any): CompanyUsageItem {
  return {
    companyName: item.company_name ?? item.companyName ?? '-',
    totalScanned: item.total_scanned ?? item.totalScanned ?? 0,
    totalContact: item.total_contact ?? item.totalContact ?? 0,
    totalExportedContact: item.total_exported_contact ?? item.totalExportedContact ?? 0,
    totalDownloadCount:
      item.total_download_count ??
      item.download_count ??
      item.totalDownloadCount ??
      item.downloadCount ??
      0,
    isDownloaded: Boolean(item.is_downloaded ?? item.isDownloaded ?? false),
  }
}

function mapTrafficChart(chart: RawTrafficChart | null | undefined): TrafficChart | undefined {
  if (!chart || !Array.isArray(chart.data)) return undefined

  return {
    date: chart.date,
    timezone: chart.timezone,
    peakHour: chart.peakHour ?? chart.peak_hour,
    peakScans: chart.peakScans ?? chart.peak_scans,
    data: chart.data.map((item) => ({
      date: item.date,
      hour: item.hour ?? '',
      label: item.label ?? String(item.hour ?? ''),
      scans: item.scans ?? item.total_scanned ?? 0,
    })),
  }
}

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
          hour?: number | string
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
          day: typeof d.day === 'number' ? d.day : undefined,
          dayLabel: d.day_label ?? d.label ?? d.date ?? 'Day',
          date: d.date,
          totalScanned: d.total_scanned ?? d.totalScanned,
          totalContact: d.total_contact ?? d.totalContact,
          totalExportedContact: d.total_exported_contact ?? d.totalExportedContact,
          totalDownloadCount:
            d.total_download_count ??
            d.download_count ??
            d.totalDownloadCount ??
            d.downloadCount,
          chart: mapTrafficChart(d.chart),
          overall: (d.companies ?? d.overall ?? d.data ?? d.items ?? d.usage ?? d.usages ?? []).map(
            mapCompanyUsageItem,
          ),
        }))
      } else if (first && typeof first === 'object' && ('company_name' in first || 'companyName' in first)) {
        const dayMap = new Map<string, CompanyUsageItem[]>()
        for (const item of data.days) {
          const label = item.day_label ?? item.label ?? item.date ?? 'Day'
          if (!dayMap.has(label)) {
            dayMap.set(label, [])
          }
          dayMap.get(label)!.push(mapCompanyUsageItem(item))
        }
        parsedDays = Array.from(dayMap.entries()).map(([dayLabel, overall]) => ({
          dayLabel,
          overall,
        }))
      } else if (first && typeof first === 'object' && 'day_label' in first) {
        parsedDays = data.days.map((d: any) => ({
          day: typeof d.day === 'number' ? d.day : undefined,
          dayLabel: d.day_label ?? d.label ?? d.date ?? 'Day',
          date: d.date,
          totalScanned: d.total_scanned ?? d.totalScanned,
          totalContact: d.total_contact ?? d.totalContact,
          totalExportedContact: d.total_exported_contact ?? d.totalExportedContact,
          totalDownloadCount:
            d.total_download_count ??
            d.download_count ??
            d.totalDownloadCount ??
            d.downloadCount,
          chart: mapTrafficChart(d.chart),
          overall: (d.companies ?? d.overall ?? d.data ?? d.items ?? []).map(mapCompanyUsageItem),
        }))
      }
    }

    let overall: CompanyUsageItem[] = []
    if (Array.isArray(data.overall) && data.overall.length > 0) {
      overall = data.overall.map(mapCompanyUsageItem)
    } else if (parsedDays.length > 0) {
      const overallDay = parsedDays.find((d) => d.dayLabel.toLowerCase() === 'overall')
      if (overallDay) {
        overall = overallDay.overall
      } else {
        const companyMap = new Map<string, CompanyUsageItem>()
        for (const day of parsedDays) {
          for (const item of day.overall) {
            const existing = companyMap.get(item.companyName) ?? {
              companyName: item.companyName,
              totalScanned: 0,
              totalContact: 0,
              totalExportedContact: 0,
              totalDownloadCount: 0,
              isDownloaded: false,
            }
            companyMap.set(item.companyName, {
              companyName: item.companyName,
              totalScanned: (existing.totalScanned ?? 0) + (item.totalScanned ?? 0),
              totalContact: (existing.totalContact ?? 0) + (item.totalContact ?? 0),
              totalExportedContact: (existing.totalExportedContact ?? 0) + (item.totalExportedContact ?? 0),
              totalDownloadCount: (existing.totalDownloadCount ?? 0) + (item.totalDownloadCount ?? 0),
              isDownloaded: Boolean(existing.isDownloaded || item.isDownloaded),
            })
          }
        }
        overall = Array.from(companyMap.values())
      }
    }

    return {
      success: true,
      data: {
        startDate: data.start_date ?? '',
        endDate: data.end_date ?? '',
        overall,
        totalScanned: data.total_scanned ?? data.totalScanned,
        totalContact: data.total_contact ?? data.totalContact,
        totalExportedContact: data.total_exported_contact ?? data.totalExportedContact,
        totalDownloadCount:
          data.total_download_count ??
          data.download_count ??
          data.totalDownloadCount ??
          data.downloadCount,
        totalLeadScannerEnabledCount:
          data.total_lead_scanner_enabled_count ?? data.totalLeadScannerEnabledCount,
        ...(parsedDays.length > 0 ? { days: parsedDays } : {}),
        ...(mapTrafficChart(data.chart) ? { chart: mapTrafficChart(data.chart) } : {}),
        ...(hourlyTraffic ? { hourlyTraffic } : {}),
        ...(data.peak_time ? { peakTime: data.peak_time } : {}),
      },
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function disableAllLeadScanners(projectId?: string): Promise<DisableAllLeadScannersResult> {
  try {
    const headers = await getAdminProjectHeaders(projectId)
    await api.patch('/v1/admin/project/lead-scanner/disable-all', {}, { headers })
    return { success: true }
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
