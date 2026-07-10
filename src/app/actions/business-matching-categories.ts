'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'
import { requireServerAuthHeaders } from '@/lib/server-auth'

export type BusinessMatchingCategoryRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export interface BusinessMatchingCategoryRequest {
  request_uuid: string
  project_uuid: string
  event_uuid: string
  event_code: string
  event_name: string
  exhibitor_uuid: string
  company_name: string
  requested_name: string
  description: string
  status: BusinessMatchingCategoryRequestStatus
  review_note: string
  created_at: string
}

async function getAuthHeaders(projectUuid: string) {
  await requireProjectContext(projectUuid)
  return requireServerAuthHeaders({ projectUuid })
}

export async function getBusinessMatchingCategoryRequests(
  projectUuid: string,
  status?: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get(
      '/v1/admin/project/business-matching/category-requests',
      {
        headers,
        params: status && status !== 'all' ? { status } : undefined,
      }
    )

    return {
      success: true as const,
      data: (response.data?.data || []) as BusinessMatchingCategoryRequest[],
    }
  } catch (error: unknown) {
    console.error('Error fetching business matching category requests:', error)
    return {
      success: false as const,
      error:
        getErrorMessage(error) ||
        'Failed to fetch business matching category requests',
      data: [] as BusinessMatchingCategoryRequest[],
    }
  }
}

export async function approveBusinessMatchingCategoryRequest(
  projectUuid: string,
  requestUuid: string,
  note?: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.put(
      `/v1/admin/project/business-matching/category-requests/${requestUuid}/approve`,
      { note },
      { headers }
    )

    revalidatePath('/admin/business-matching-categories')
    return { success: true as const, data: response.data?.data }
  } catch (error: unknown) {
    console.error('Error approving business matching category request:', error)
    return {
      success: false as const,
      error:
        getErrorMessage(error) ||
        'Failed to approve business matching category request',
    }
  }
}

export async function rejectBusinessMatchingCategoryRequest(
  projectUuid: string,
  requestUuid: string,
  note?: string
) {
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.put(
      `/v1/admin/project/business-matching/category-requests/${requestUuid}/reject`,
      { note },
      { headers }
    )

    revalidatePath('/admin/business-matching-categories')
    return { success: true as const, data: response.data?.data }
  } catch (error: unknown) {
    console.error('Error rejecting business matching category request:', error)
    return {
      success: false as const,
      error:
        getErrorMessage(error) ||
        'Failed to reject business matching category request',
    }
  }
}
