"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger-client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Trash2, ArrowRight } from "lucide-react"
import { apiGet, apiPut } from "@/lib/api-client"

interface Notification {
  id: string | number
  type: 'system' | 'deposit' | 'withdraw' | 'chat' | 'promotion'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const KNOWN_TYPES = new Set(['system', 'deposit', 'withdraw', 'chat', 'promotion'])

function normalizeNotificationRow(raw: Record<string, unknown>): Notification {
  const typeRaw = String(raw.type ?? 'system').toLowerCase()
  const type = (KNOWN_TYPES.has(typeRaw) ? typeRaw : 'system') as Notification['type']
  const created =
    (raw.created_at as string) ||
    (raw.createdAt as string) ||
    new Date().toISOString()
  return {
    id: raw.id as string | number,
    type,
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    is_read: Boolean(raw.is_read ?? raw.isRead ?? false),
    created_at: created,
  }
}

export function OverviewNotifications({ onViewAll }: { onViewAll?: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 2

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await apiGet('/api/notifications', {}, { silent: true })
      
      if (result.success && Array.isArray(result.notifications)) {
        const sorted = result.notifications
          .map((n: Record<string, unknown>) => normalizeNotificationRow(n))
          .sort(
            (a: Notification, b: Notification) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        // Lấy top 10 thông báo mới nhất cho overview để phân trang
        setNotifications(sorted.slice(0, 10))
      }
    } catch (error: any) {
      if (error.message?.includes('Unauthorized')) {
        logger.warn('User not authenticated, skipping notifications load')
        setNotifications([])
      } else {
        logger.error('Error loading notifications', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const markAsRead = useCallback(async (notificationId: string | number) => {
    try {
      await apiPut(`/api/notifications/${notificationId}`, { is_read: true })
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      logger.error('Error marking notification as read', error)
    }
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit': return '💰'
      case 'withdraw': return '💸'
      case 'chat': return '💬'
      case 'promotion': return '🎁'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'withdraw': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'chat': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'promotion': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length
  const totalPages = Math.ceil(notifications.length / pageSize)
  const paginatedNotifications = notifications.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <Card className="bg-white/60 dark:bg-black/50 overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            <Bell className="w-5 h-5 mr-2" />
            Thông báo mới
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-600 text-white text-xs">
                {unreadCount} mới
              </Badge>
            )}
          </CardTitle>
          {onViewAll && (
            <Button
              variant="ghost" 
              size="sm" 
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
              onClick={onViewAll}
            >
              Xem tất cả <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
             <div className="flex h-40 items-center justify-center">
               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
             </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col h-40 items-center justify-center text-muted-foreground p-4 text-center">
              <Bell className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Không có thông báo mới nào</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-3 p-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                   <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background border shadow-sm text-base">
                     {getNotificationIcon(notification.type)}
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`text-sm font-medium line-clamp-1 ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title || 'Thông báo'}
                    </h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                       {new Date(notification.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <p className={`text-xs line-clamp-2 ${!notification.is_read ? 'text-foreground/80' : 'text-muted-foreground/70'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="flex-shrink-0 self-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      onClick={() => markAsRead(notification.id)}
                      title="Đánh dấu đã đọc"
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-3 border-t border-white/5 bg-background/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="text-lg">{"<"}</span>
                </Button>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="text-lg">{">"}</span>
                </Button>
              </div>
            )}
          </div>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
