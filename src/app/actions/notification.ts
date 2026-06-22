'use server'

import { revalidatePath } from 'next/cache'
import api, { getErrorMessage } from '@/lib/api'
import { requireProjectContext } from '@/lib/authorization'
import { requireServerAuthHeaders } from '@/lib/server-auth'

export interface AdminNotification {
  notification_uuid: string
  title?: string
  message?: string
  body?: string
  type?: string
  is_read?: boolean
  read_at?: string | null
  created_at?: string
}

async function getHeaders(projectUuid: string) {
  await requireProjectContext(projectUuid)
  return requireServerAuthHeaders({ projectUuid })
}

export async function getNotifications(
  projectUuid: string,
  unreadOnly = false
) {
  try {
    const headers = await getHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/notifications', {
      headers,
      params: { unread_only: unreadOnly },
    })

    return {
      success: true as const,
      data: (response.data?.data || []) as AdminNotification[],
    }
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to fetch notifications',
      data: [] as AdminNotification[],
    }
  }
}

export async function getNotificationsCount(projectUuid: string) {
  try {
    const headers = await getHeaders(projectUuid)
    const response = await api.get('/v1/admin/project/notifications/count', {
      headers,
    })

    return {
      success: true as const,
      data: Number(response.data?.data?.unread_count) || 0,
    }
  } catch (error: unknown) {
    console.error('Error fetching notification count:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to fetch notification count',
      data: 0,
    }
  }
}

export async function markNotificationRead(
  projectUuid: string,
  notificationUuid: string
) {
  try {
    const headers = await getHeaders(projectUuid)
    await api.get(
      `/v1/admin/project/notifications/${encodeURIComponent(notificationUuid)}/read`,
      { headers }
    )
    revalidatePath('/admin/notifications')
    return { success: true as const }
  } catch (error: unknown) {
    console.error('Error marking notification as read:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to mark notification as read',
    }
  }
}

export async function markAllNotificationsRead(projectUuid: string) {
  try {
    const headers = await getHeaders(projectUuid)
    await api.patch('/v1/admin/project/notifications/read-all', undefined, {
      headers,
    })
    revalidatePath('/admin/notifications')
    return { success: true as const }
  } catch (error: unknown) {
    console.error('Error marking all notifications as read:', error)
    return {
      success: false as const,
      error: getErrorMessage(error) || 'Failed to mark all notifications as read',
    }
  }
}
