'use server'

import api, { getErrorMessage } from '@/lib/api'
import { requireServerAuthHeaders } from '@/lib/server-auth'

export type PaymentCodeStatus = 'all' | 'unused' | 'used'

export interface PaymentCodeFilters {
  status?: PaymentCodeStatus
  search?: string
  page?: number
  pageSize?: number
}

export interface PaymentCodeRegistrationPreview {
  registration_uuid: string
  registration_code: string
  first_name: string
  last_name: string
  email: string
}

export interface PaymentCodeItem {
  payment_code_uuid: string
  code: string
  status: Exclude<PaymentCodeStatus, 'all'>
  used_at: string | null
  used_by_registration_uuid: string | null
  registration: PaymentCodeRegistrationPreview | null
}

export interface PaymentCodeSummary {
  total: number
  unused: number
  used: number
}

export interface PaymentCodeListResponse {
  summary: PaymentCodeSummary
  items: PaymentCodeItem[]
  page: number
  page_size: number
  total: number
}

function emptyPaymentCodeList(filters: PaymentCodeFilters): PaymentCodeListResponse {
  return {
    summary: { total: 0, unused: 0, used: 0 },
    items: [],
    page: filters.page ?? 1,
    page_size: filters.pageSize ?? 25,
    total: 0,
  }
}

function listParams(filters: PaymentCodeFilters) {
  return {
    status: filters.status ?? 'all',
    search: filters.search ?? '',
    page: filters.page ?? 1,
    page_size: filters.pageSize ?? 25,
  }
}

function exportParams(filters: PaymentCodeFilters) {
  return {
    status: filters.status ?? 'all',
    search: filters.search ?? '',
  }
}

export async function getPaymentCodes(projectUuid: string, filters: PaymentCodeFilters = {}) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })
    const response = await api.get('/v1/admin/project/payment-codes', {
      headers,
      params: listParams(filters),
    })

    return { success: true, data: response.data?.data as PaymentCodeListResponse }
  } catch (error: unknown) {
    console.error('Error fetching payment codes:', error)
    return { success: false, error: getErrorMessage(error), data: emptyPaymentCodeList(filters) }
  }
}

export async function exportPaymentCodes(projectUuid: string, filters: PaymentCodeFilters = {}) {
  try {
    const headers = await requireServerAuthHeaders({ projectUuid })
    const response = await api.get('/v1/admin/project/payment-codes/export', {
      headers,
      params: exportParams(filters),
      responseType: 'arraybuffer',
    })

    return {
      success: true,
      data: new Uint8Array(response.data),
      contentType: response.headers['content-type'],
    }
  } catch (error: unknown) {
    console.error('Error exporting payment codes:', error)
    return { success: false, error: getErrorMessage(error) }
  }
}
