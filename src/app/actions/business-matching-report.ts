'use server'

import api, { getErrorMessage } from '@/lib/api'
import { verifyProjectAccess } from '@/lib/authorization'
import { getServerAuthContext, requireServerAuthHeaders } from '@/lib/server-auth'

export type BusinessMatchingRole = 'ADMIN' | 'ORGANIZER'

export type BusinessMatchingEvent = {
  event_uuid: string
  event_name: string
}

export type BusinessMatchingSummaryTotals = {
  requested?: number
  accepted?: number
  rejected?: number
  cancelled?: number
  expired?: number
  closed?: number
  rescheduled?: number
  success?: number
  redemption_stamps_issued?: number
  redemption_stamps_redeemed?: number
  surveys_submitted?: number
  average_survey_rating?: number
}

export type BusinessMatchingSummary = {
  project_uuid: string
  event_uuid: string
  generated_at: string
  totals?: BusinessMatchingSummaryTotals
}

export type BusinessMatchingDetailType = 'match-requests' | 'redemption-stamps' | 'surveys'

export type BusinessMatchingReportInput = {
  role: BusinessMatchingRole
  projectId?: string
  eventId?: string
}

export type BusinessMatchingDetailsInput = {
  role: BusinessMatchingRole
  projectId?: string
  eventId?: string
  type: BusinessMatchingDetailType
  status?: string
  outcome?: string
  rating?: number
  ratingMax?: number
  satisfactionLevel?: string
  q?: string
  offset?: number
  limit?: number
}

export type BusinessMatchingExportInput = {
  role: BusinessMatchingRole
  projectId?: string
  eventId?: string
  type: BusinessMatchingDetailType
  status?: string
  outcome?: string
  rating?: number
  ratingMax?: number
  satisfactionLevel?: string
  q?: string
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
  const eventUuid = input.eventId === 'all'
    ? 'all'
    : input.eventId && events.some((event) => event.event_uuid === input.eventId)
    ? input.eventId
    : 'all'

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

    const targetEventUuids = eventUuid === 'all' ? events.map((event) => event.event_uuid) : [eventUuid]
    const summaries = await Promise.all(
      targetEventUuids.map(async (selectedEventUuid) => {
        const response = await api.get('/v1/business-matching/admin/reports/summary', {
          headers,
          params: { project_uuid: projectUuid, event_uuid: selectedEventUuid },
        })
        return response.data.data as BusinessMatchingSummary
      }),
    )

    const summary: BusinessMatchingSummary =
      eventUuid === 'all'
        ? {
            ...summaries[0],
            event_uuid: 'all',
            totals: summaries.reduce((totals, item) => {
              const res = { ...totals }
              for (const [k, v] of Object.entries(item.totals || {})) {
                const key = k as keyof BusinessMatchingSummaryTotals
                if (typeof v === 'number') {
                  res[key] = ((res[key] as number) ?? 0) + v
                }
              }
              return res
            }, {} as BusinessMatchingSummaryTotals),
          }
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
    const targetEventUuids = eventUuid === 'all' ? events.map((event) => event.event_uuid) : [eventUuid]
    const responses = await Promise.all(
      targetEventUuids.map((selectedEventUuid) =>
        api.get(`/v1/business-matching/admin/reports/${input.type}`, {
          headers,
          params: {
            project_uuid: projectUuid,
            event_uuid: selectedEventUuid,
            status: input.status,
            outcome: input.outcome,
            rating: input.rating,
            rating_max: input.ratingMax,
            satisfaction_level: input.satisfactionLevel,
            q: input.q,
            limit: eventUuid === 'all' ? 500 : input.limit,
            offset: eventUuid === 'all' ? 0 : input.offset,
          },
        }),
      ),
    )
    const items = responses.flatMap((response) => response.data?.data?.items ?? [])
    return {
      success: true,
      items: eventUuid === 'all' ? items.slice(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 25)) : items,
      total: eventUuid === 'all' ? items.length : responses[0].data?.data?.pagination?.total ?? 0,
    }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}

export async function exportBusinessMatchingCsv(
  input: BusinessMatchingExportInput,
): Promise<BusinessMatchingExportResult> {
  try {
    const { projectUuid, eventUuid, events, headers } = await getBusinessMatchingScope(input)
    const targetEventUuids = eventUuid === 'all' ? events.map((event) => event.event_uuid) : [eventUuid]

    const responses = await Promise.all(
      targetEventUuids.map(async (selectedEventUuid) => {
        const response = await api.get(`/v1/business-matching/admin/reports/${input.type}/export.csv`, {
          headers,
          params: {
            project_uuid: projectUuid,
            event_uuid: selectedEventUuid,
            status: input.status,
            outcome: input.outcome,
            rating: input.rating,
            rating_max: input.ratingMax,
            satisfaction_level: input.satisfactionLevel,
            q: input.q,
          },
          responseType: 'arraybuffer',
        })
        const disposition = response.headers['content-disposition'] ?? ''
        const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? `${input.type}.csv`
        return {
          text: new TextDecoder('utf-8').decode(response.data),
          filename,
        }
      }),
    )

    if (responses.length === 1) {
      const bytes = Array.from(new TextEncoder().encode(responses[0].text))
      return { success: true, bytes, filename: responses[0].filename }
    }

    const allLines: string[] = []
    responses.forEach((resp, idx) => {
      const lines = resp.text.split(/\r?\n/).filter((l) => l.trim().length > 0)
      if (idx === 0) {
        allLines.push(...lines)
      } else if (lines.length > 1) {
        allLines.push(...lines.slice(1))
      }
    })

    const mergedCsv = allLines.join('\n')
    const bytes = Array.from(new TextEncoder().encode(mergedCsv))
    return { success: true, bytes, filename: responses[0]?.filename ?? `${input.type}.csv` }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
