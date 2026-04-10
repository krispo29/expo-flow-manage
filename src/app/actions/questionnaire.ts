'use server'

import api from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'

async function getAuthHeaders(projectUuid?: string) {
  return requireServerAuthHeaders({ projectUuid })
}

export interface QuestionnaireStatOption {
  uuid: string
  label: {
    en?: string
    vn?: string
  }
  value: string
  has_text_input: boolean
  answer_count: number
  percentage: number
}

export interface QuestionnaireStat {
  question_uuid: string
  question_text: {
    en?: string
    vn?: string
  }
  question_type: string
  is_required: boolean
  order_index: number
  parent_question_uuid: string | null
  parent_option_value: string | null
  for_event_uuid: string | null
  total_answers: number
  options: QuestionnaireStatOption[]
}

export async function getQuestionnaireStats(eventUuid?: string) {
  try {
    const headers = await getAuthHeaders()
    const url = eventUuid 
      ? `/v1/admin/project/questionnaires/stats?for_event_uuid=${eventUuid}` 
      : '/v1/admin/project/questionnaires/stats'
    const response = await api.get(url, { headers })

    return {
      success: true,
      data: (response.data?.data || []) as QuestionnaireStat[],
    }
  } catch (error: unknown) {
    console.error('Error fetching questionnaire stats:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch questionnaire stats'
    return { success: false, error: errorMessage, data: [] as QuestionnaireStat[] }
  }
}
