'use client'

import { useState, useEffect, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, Circle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import {
  getNotifications,
  getNotificationsCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AdminNotification,
} from '@/app/actions/notification'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

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

export function NotificationBell() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const { user, isAuthenticated } = useAuthStore()
  
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Only admins have access to system notifications in current configuration
  const isAdmin = isAuthenticated && user?.role === 'ADMIN'

  const fetchNotificationData = (showToast = false) => {
    if (!projectId || !isAdmin) return

    startTransition(async () => {
      const [listResult, countResult] = await Promise.all([
        getNotifications(projectId),
        getNotificationsCount(projectId),
      ])

      if (listResult.success) {
        setNotifications(listResult.data)
      } else if (showToast) {
        toast.error(listResult.error || 'Failed to load notifications')
      }

      if (countResult.success) {
        setUnreadCount(countResult.data)
      } else if (showToast) {
        toast.error(countResult.error || 'Failed to load notification count')
      }

      if (showToast && listResult.success && countResult.success) {
        toast.success('Notifications updated')
      }
    })
  }

  // Fetch count on mount and when projectId changes
  useEffect(() => {
    fetchNotificationData()
    // Poll for notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotificationData()
    }, 60000)

    return () => clearInterval(interval)
  }, [projectId, isAdmin])

  // Refetch when popover opens
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      fetchNotificationData()
    }
  }

  const markOne = (notification: AdminNotification) => {
    if (!projectId || !isUnread(notification)) return
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
    if (!projectId) return
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

  if (!isAdmin || !projectId) return null

  // Show at most 5 items in the preview list
  const previewNotifications = notifications.slice(0, 5)

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-foreground/70 hover:text-primary transition-all duration-300 hover:scale-105 active:scale-95"
          aria-label="Notifications"
        >
          <Bell className={cn("size-5", unreadCount > 0 && "animate-pulse")} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-md shadow-destructive/20 animate-bounce">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-80 p-0 overflow-hidden border border-primary/10 glass-elevated shadow-xl rounded-2xl"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-primary/10 px-4 py-3 bg-primary/[0.02]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0.5 text-[10px] font-bold">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={isPending}
              onClick={() => fetchNotificationData(true)}
              title="Refresh"
            >
              <RefreshCw className={cn("size-3.5", isPending && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={isPending || unreadCount === 0}
              onClick={markAll}
              title="Mark all read"
            >
              <CheckCheck className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Content list */}
        <ScrollArea className="max-h-72">
          {isPending && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="size-6 animate-spin text-primary" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Bell className="size-8 opacity-40" />
              <span className="text-xs font-semibold">No notifications yet</span>
            </div>
          ) : (
            <div className="divide-y divide-primary/5">
              {previewNotifications.map((notification) => {
                const unread = isUnread(notification)
                const isItemPending = pendingId === notification.notification_uuid
                
                return (
                  <button
                    key={notification.notification_uuid}
                    type="button"
                    disabled={!unread || isItemPending}
                    onClick={() => markOne(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                      unread 
                        ? 'bg-primary/[0.03] hover:bg-primary/[0.08] cursor-pointer' 
                        : 'bg-transparent opacity-85 hover:bg-muted/10'
                    )}
                  >
                    <Circle
                      className={cn(
                        'mt-1 size-2 shrink-0 transition-all duration-300',
                        unread ? 'fill-primary text-primary scale-110' : 'fill-muted/40 text-muted/40'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground truncate">
                          {notification.title || notification.type || 'Notification'}
                        </span>
                        {notification.type && (
                          <Badge variant="secondary" className="px-1 text-[8px] py-0 leading-none h-3.5 scale-90 origin-left uppercase font-black tracking-wider">
                            {notification.type}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {notification.message || notification.body || 'No details provided'}
                      </p>
                      <span className="mt-1 block text-[10px] text-muted-foreground/60 font-semibold">
                        {relativeDate(notification.created_at)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-primary/10 p-2 bg-primary/[0.01] text-center">
          <Link 
            href={`/admin/notifications?projectId=${projectId}`}
            onClick={() => setIsOpen(false)}
            className="block w-full py-1.5 text-center text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
          >
            View All Notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
