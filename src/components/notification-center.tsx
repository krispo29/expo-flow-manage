'use client'

import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, BellRing, CheckCheck, Circle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  getNotifications,
  getNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotification,
} from '@/app/actions/notification'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface NotificationCenterProps {
  projectId: string
  initialNotifications: AdminNotification[]
  initialUnreadCount: number
  initialError?: string
}

function isUnread(notification: AdminNotification) {
  return notification.is_read === false || (!notification.is_read && !notification.read_at)
}

function relativeDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : formatDistanceToNow(date, { addSuffix: true })
}

export function NotificationCenter({
  projectId,
  initialNotifications,
  initialUnreadCount,
  initialError,
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const visibleNotifications =
    filter === 'unread' ? notifications.filter(isUnread) : notifications

  const refresh = (showToast = false) => {
    startTransition(async () => {
      const [listResult, countResult] = await Promise.all([
        getNotifications(projectId),
        getNotificationsCount(projectId),
      ])
      if (!listResult.success) {
        toast.error(listResult.error)
        return
      }
      setNotifications(listResult.data)
      setUnreadCount(countResult.data)
      if (!countResult.success) toast.error(countResult.error)
      else if (showToast) toast.success('Notifications refreshed')
    })
  }

  const markOne = (notification: AdminNotification) => {
    if (!isUnread(notification)) return
    setPendingId(notification.notification_uuid)
    startTransition(async () => {
      const result = await markNotificationRead(
        projectId,
        notification.notification_uuid
      )
      setPendingId(null)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setNotifications((items) =>
        items.map((item) =>
          item.notification_uuid === notification.notification_uuid
            ? { ...item, is_read: true, read_at: new Date().toISOString() }
            : item
        )
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    })
  }

  const markAll = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead(projectId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      const readAt = new Date().toISOString()
      setNotifications((items) =>
        items.map((item) => ({ ...item, is_read: true, read_at: readAt }))
      )
      setUnreadCount(0)
      toast.success('All notifications marked as read')
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Updates and activity for the selected project.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={isPending}
            onClick={() => refresh(true)}
          >
            <RefreshCw data-icon="inline-start" className={cn(isPending && 'animate-spin')} />
            Refresh
          </Button>
          <Button disabled={isPending || unreadCount === 0} onClick={markAll}>
            <CheckCheck data-icon="inline-start" />
            Mark all read
          </Button>
        </div>
      </header>

      {initialError ? (
        <Alert variant="destructive">
          <BellRing />
          <AlertTitle>Notifications could not be loaded</AlertTitle>
          <AlertDescription>{initialError}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">All notifications</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-black">{notifications.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Unread</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-black text-primary">
            {unreadCount}
          </CardContent>
        </Card>
      </section>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as 'all' | 'unread')}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {visibleNotifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
            <Bell className="size-10 text-muted-foreground" />
            <p className="font-bold">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleNotifications.map((notification) => {
            const unread = isUnread(notification)
            return (
              <button
                key={notification.notification_uuid}
                type="button"
                disabled={!unread || pendingId === notification.notification_uuid}
                onClick={() => markOne(notification)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                  unread ? 'bg-primary/5 hover:bg-primary/10' : 'bg-card opacity-75'
                )}
              >
                <Circle
                  className={cn(
                    'mt-1 size-2 shrink-0',
                    unread ? 'fill-primary text-primary' : 'fill-muted text-muted'
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">
                      {notification.title || notification.type || 'Notification'}
                    </span>
                    {notification.type ? (
                      <Badge variant="secondary">{notification.type}</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {notification.message || notification.body || 'No details provided'}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {relativeDate(notification.created_at)}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
