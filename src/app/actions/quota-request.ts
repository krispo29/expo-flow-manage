'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import axios from 'axios'
import api from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'

// Helper function to get headers with auth
async function getAuthHeaders(projectUuid: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value
  
  return {
    'X-Project-UUID': projectUuid,
    ...(token && { Authorization: `Bearer ${token}` })
  }
}

export interface QuotaRequest {
  request_uuid: string
  exhibitor_uuid: string
  company_name: string
  requested_by: string
  requested_amount: number
  status: 'pending' | 'approved' | 'rejected'
  note: string
  created_at: string
}

// GET /v1/admin/project/quota-requests
export async function getQuotaRequests(projectUuid: string) {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/quota-requests', { headers })
    
    return { success: true, data: response.data.data || [] }
  } catch (error: unknown) {
    console.error('Error fetching quota requests:', error)
    return { success: false, error: 'Failed to fetch quota requests' }
  }
}

// PUT /v1/admin/project/quota-requests/:uuid/approve
export async function approveQuotaRequest(projectUuid: string, requestUuid: string) {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put(`/v1/admin/project/quota-requests/${requestUuid}/approve`, {}, { headers })
    
    revalidatePath('/admin/quota-requests')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error approving quota request:', error)
    const errMsg = axios.isAxiosError(error) 
      ? (error.response?.data as any)?.message || 'Failed to approve quota request'
      : 'An unexpected error occurred'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/quota-requests/:uuid/reject
export async function rejectQuotaRequest(projectUuid: string, requestUuid: string, note: string = '') {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put(`/v1/admin/project/quota-requests/${requestUuid}/reject`, { note }, { headers })
    
    revalidatePath('/admin/quota-requests')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error rejecting quota request:', error)
    const errMsg = axios.isAxiosError(error) 
      ? (error.response?.data as any)?.message || 'Failed to reject quota request'
      : 'An unexpected error occurred'
    return { success: false, error: errMsg }
  }
}

// PUT /v1/admin/project/quota-requests/:uuid/undo
export async function undoQuotaRequest(projectUuid: string, requestUuid: string) {
  await requireProjectContext(projectUuid)
  
  try {
    const headers = await getAuthHeaders(projectUuid)
    await api.put(`/v1/admin/project/quota-requests/${requestUuid}/undo`, {}, { headers })
    
    revalidatePath('/admin/quota-requests')
    return { success: true }
  } catch (error: unknown) {
    console.error('Error undoing quota request:', error)
    const errMsg = axios.isAxiosError(error) 
      ? (error.response?.data as any)?.message || 'Failed to undo quota request'
      : 'An unexpected error occurred'
    return { success: false, error: errMsg }
  }
}
