'use server'

import api from '@/lib/api'
import { cookies } from 'next/headers'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid?: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid || cookieStore.get('project_uuid')?.value,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardAttendeeType {
  type_code: string
  type_name: string
  count: number
}

export interface DashboardSummary {
  total_exhibitors: number
  total_participants: number
  total_conferences: number
  total_rooms: number
  attendee_types: DashboardAttendeeType[]
}

export interface DashboardRecentParticipant {
  registration_uuid: string
  registration_code: string
  first_name: string
  last_name: string
  company_name: string
  attendee_type_code: string
  registered_at: string
}

export interface DashboardConference {
  conference_uuid: string
  title: string
  location: string
  start_time: string
  end_time: string
  show_date: string
  reserved_count: number
}

export interface DashboardData {
  summary: DashboardSummary
  recent_participants: DashboardRecentParticipant[]
  conferences: DashboardConference[]
}

// ─── Action ───────────────────────────────────────────────────────────────────

export async function getDashboard() {
  try {
    const headers = await getAuthHeaders()
    const response = await api.get('/v1/admin/project/report/dashboard', { headers })

    return { success: true, data: response.data.data as DashboardData }
  } catch (error: unknown) {
    console.error('Error fetching dashboard:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch dashboard'
    return { success: false, error: errorMessage }
  }
}
