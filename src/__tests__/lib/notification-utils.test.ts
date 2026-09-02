import { getNotificationUrl } from '@/lib/notification-utils'
import type { AdminNotification } from '@/app/actions/notification'

describe('getNotificationUrl', () => {
  it('should return /admin/quota-requests?projectId=... for admin quota request notification', () => {
    const notification: AdminNotification = {
      notification_uuid: 'notif-1',
      title: 'Quota Request ใหม่',
      message: 'Staff [ST151125] ขอเพิ่ม quota สำหรับ Duksan (Asia Chemie) จำนวน 1 คน',
      type: 'QUOTA_REQUEST',
    }

    const url = getNotificationUrl(notification, 'ADMIN', 'proj-123')
    expect(url).toBe('/admin/quota-requests?projectId=proj-123')
  })

  it('should return /organizer/quota-requests?projectId=... for organizer quota request notification', () => {
    const notification: AdminNotification = {
      notification_uuid: 'notif-2',
      title: 'Quota Request ใหม่',
      message: 'Staff ขอเพิ่ม quota',
    }

    const url = getNotificationUrl(notification, 'ORGANIZER', 'proj-456')
    expect(url).toBe('/organizer/quota-requests?projectId=proj-456')
  })

  it('should return /admin/upgrade-requests?projectId=... for upgrade request notification', () => {
    const notification: AdminNotification = {
      notification_uuid: 'notif-3',
      title: 'Upgrade Request',
      message: 'Exhibitor requests upgrade',
    }

    const url = getNotificationUrl(notification, 'ADMIN', 'proj-789')
    expect(url).toBe('/admin/upgrade-requests?projectId=proj-789')
  })

  it('should use explicit target_url or path when provided in notification', () => {
    const notification: AdminNotification = {
      notification_uuid: 'notif-4',
      title: 'Custom Notif',
      target_url: '/admin/custom-page',
    }

    const url = getNotificationUrl(notification, 'ADMIN', 'proj-999')
    expect(url).toBe('/admin/custom-page?projectId=proj-999')
  })

  it('should return null when notification has no matched routing target', () => {
    const notification: AdminNotification = {
      notification_uuid: 'notif-5',
      title: 'System Announcement',
      message: 'System will be updated tonight',
    }

    const url = getNotificationUrl(notification, 'ADMIN', 'proj-123')
    expect(url).toBeNull()
  })
})
