import type { AdminNotification } from '@/app/actions/notification'

/**
 * Resolves the destination URL for a given notification.
 * Handles role-based routing (admin/organizer) and preserves projectId.
 */
export function getNotificationUrl(
  notification: AdminNotification,
  role?: string,
  projectId?: string | null
): string | null {
  const roleLower = (role || '').toLowerCase()
  const basePath = roleLower === 'organizer' ? '/organizer' : '/admin'
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''

  // 1. Check if the notification payload contains a direct url/path
  const directPath =
    notification.url ||
    notification.target_url ||
    notification.link ||
    notification.path

  if (typeof directPath === 'string' && directPath.trim().length > 0) {
    const trimmed = directPath.trim()
    if (trimmed.startsWith('/')) {
      if (projectId && !trimmed.includes('projectId=')) {
        return `${trimmed}${trimmed.includes('?') ? '&' : '?'}projectId=${encodeURIComponent(projectId)}`
      }
      return trimmed
    }
    return `${basePath}/${trimmed.replace(/^\/+/, '')}${qs}`
  }

  // 2. Detect based on notification metadata (type, title, message/body)
  const type = (notification.type || '').toLowerCase()
  const title = (notification.title || '').toLowerCase()
  const message = (notification.message || notification.body || '').toLowerCase()

  // Quota Requests
  if (
    type.includes('quota') ||
    title.includes('quota') ||
    message.includes('quota')
  ) {
    return `${basePath}/quota-requests${qs}`
  }

  // Upgrade Requests
  if (
    type.includes('upgrade') ||
    title.includes('upgrade') ||
    message.includes('upgrade')
  ) {
    return `${basePath}/upgrade-requests${qs}`
  }

  // Business Matching
  if (
    type.includes('matching') ||
    title.includes('matching') ||
    message.includes('matching')
  ) {
    return `${basePath}/business-matching${qs}`
  }

  return null
}
