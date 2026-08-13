'use server'

import api, { getErrorMessage } from '@/lib/api'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export type BusinessMatchingRole = 'ADMIN' | 'ORGANIZER'

export type BusinessMatchingEvent = {
  event_uuid: string
  event_name: string
  event_code?: string
  order_index?: number
}

export type BusinessMatchingSummary = {
  project_uuid: string
  event_uuid: string
  generated_at: string
  totals: {
    requested?: number
    accepted?: number
    rejected?: number
    cancelled?: number
    expired?: number
    closed?: number
    success?: number
    redemption_stamps_issued?: number
    redemption_stamps_redeemed?: number
    surveys_submitted?: number
    average_survey_rating?: number
  }
}

export type BusinessMatchingReportInput = {
  role: BusinessMatchingRole
  projectId?: string
  eventId?: string
}

export type BusinessMatchingDetailType = 'match-requests' | 'redemption-stamps' | 'surveys'

export type BusinessMatchingDetailsInput = BusinessMatchingReportInput & {
  eventId: string
  type: BusinessMatchingDetailType
  q?: string
  status?: string
  offset?: number
  limit?: number
}

export type BusinessMatchingDetailsResult =
  | { success: true; items: Record<string, unknown>[]; total: number }
  | { success: false; error: string }

export type BusinessMatchingExportResult =
  | { success: true; bytes: number[]; filename: string }
  | { success: false; error: string }

export type BusinessMatchingReportResult =
  | {
      success: true
      projectUuid: string
      eventUuid: string
      events: BusinessMatchingEvent[]
      summary: BusinessMatchingSummary
    }
  | { success: false; error: string; events: BusinessMatchingEvent[] }

type BusinessMatchingContextProject = {
  project_uuid: string
  default_event_uuid?: string
  events?: BusinessMatchingEvent[]
}

type BusinessMatchingScope = {
  projectUuid: string
  eventUuid: string
  events: BusinessMatchingEvent[]
  headers: Record<string, string>
}

async function getBusinessMatchingScope(input: BusinessMatchingReportInput): Promise<BusinessMatchingScope> {
  const auth = await getServerAuthContext()
  if (!auth?.userRole || auth.userRole !== input.role) {
    throw new Error('Unauthorized')
  }

  const projectUuid = input.role === 'ORGANIZER' ? auth.projectUuid : input.projectId
  if (!projectUuid) {
    throw new Error('Select a project to view the Business Matching report')
  }
  if (!(await verifyProjectAccess(projectUuid))) {
    throw new Error(`Unauthorized: Access denied to project ${projectUuid}`)
  }

  const headers = await requireServerAuthHeaders({ projectUuid })
  const contextResponse = await api.get('/v1/business-matching/context', { headers })
  const projects = (contextResponse.data?.data?.projects ?? []) as BusinessMatchingContextProject[]
  const project = projects.find((item) => item.project_uuid === projectUuid)
  const events = project?.events ?? []
  const eventUuid = !input.eventId || input.eventId === 'all'
    ? 'all'
    : events.some((event) => event.event_uuid === input.eventId)
    ? input.eventId
    : project?.default_event_uuid ?? events[0]?.event_uuid

  if (!eventUuid || (eventUuid === 'all' && events.length === 0)) {
    throw new Error('No Business Matching event is configured for this project')
  }

  return { projectUuid, eventUuid, events, headers }
}

export async function getBusinessMatchingReport(
  input: BusinessMatchingReportInput,
): Promise<BusinessMatchingReportResult> {
  try {
    const { projectUuid, eventUuid, events, headers } = await getBusinessMatchingScope(input)

    const summaries = await Promise.all((eventUuid === 'all' ? events.map((event) => event.event_uuid) : [eventUuid]).map(async (selectedEventUuid) => {
      const response = await api.get('/v1/business-matching/admin/reports/summary', { headers, params: { project_uuid: projectUuid, event_uuid: selectedEventUuid } })
      return response.data.data as BusinessMatchingSummary
    }))
    const summary = eventUuid === 'all'
      ? { ...summaries[0], event_uuid: 'all', totals: summaries.reduce((totals, item) => Object.fromEntries(Object.entries(item.totals).map(([key, value]) => [key, (totals[key as keyof typeof totals] ?? 0) + (typeof value === 'number' ? value : 0)])) as BusinessMatchingSummary['totals'], {} as BusinessMatchingSummary['totals']) }
      : summaries[0]

    return {
      success: true,
      projectUuid,
      eventUuid,
      events,
      summary,
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error), events: [] }
  }
}

export async function getBusinessMatchingDetails(
  input: BusinessMatchingDetailsInput,
): Promise<BusinessMatchingDetailsResult> {
  try {
    const { projectUuid, eventUuid, events, headers } = await getBusinessMatchingScope(input)
    const responses = await Promise.all((eventUuid === 'all' ? events.map((event) => event.event_uuid) : [eventUuid]).map((selectedEventUuid) => api.get(`/v1/business-matching/admin/reports/${input.type}`, { headers, params: { project_uuid: projectUuid, event_uuid: selectedEventUuid, status: input.status, q: input.q, limit: eventUuid === 'all' ? 500 : input.limit, offset: eventUuid === 'all' ? 0 : input.offset } })))
    const items = responses.flatMap((response) => response.data?.data?.items ?? [])
    return { success: true, items: eventUuid === 'all' ? items.slice(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 25)) : items, total: eventUuid === 'all' ? items.length : responses[0].data?.data?.pagination?.total ?? 0 }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function exportBusinessMatchingCsv(
  input: BusinessMatchingDetailsInput,
): Promise<BusinessMatchingExportResult> {
  try {
    const { projectUuid, eventUuid, headers } = await getBusinessMatchingScope(input)
    const response = await api.get(`/v1/business-matching/admin/reports/${input.type}/export.csv`, {
      headers,
      params: { project_uuid: projectUuid, event_uuid: eventUuid, status: input.status, q: input.q },
      responseType: 'arraybuffer',
    })
    const disposition = response.headers['content-disposition'] ?? ''
    const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? `${input.type}.csv`
    return { success: true, bytes: Array.from(new Uint8Array(response.data)), filename }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
