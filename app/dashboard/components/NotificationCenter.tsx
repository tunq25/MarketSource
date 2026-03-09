"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Trash2, Filter, X } from "lucide-react"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string | number
  type: 'system' | 'deposit' | 'withdraw' | 'chat' | 'promotion'
  title: string
  message: string
  is_read: boolean
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all")

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await apiGet('/api/notifications')
      
      if (result.success && result.notifications) {
        const sorted = result.notifications.sort((a: Notification, b: Notification) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setNotifications(sorted)
        setFilteredNotifications(sorted)
      }
    } catch (error: any) {
      // ✅ FIX: Chỉ log error nếu không phải Unauthorized (401)
      if (error.message?.includes('Unauthorized')) {
        logger.warn('User not authenticated, skipping notifications load')
        // Fallback to empty array
        setNotifications([])
        setFilteredNotifications([])
      } else {
      logger.error('Error loading notifications', error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  // Filter notifications by type and read status
  useEffect(() => {
    let filtered = notifications

    // Filter by read status
    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.is_read)
    } else if (activeTab === "read") {
      filtered = filtered.filter(n => n.is_read)
    }

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter(n => n.type === filterType)
    }

    setFilteredNotifications(filtered)
  }, [notifications, filterType, activeTab])

  // Mark as read
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

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      
      await Promise.all(
        unreadIds.map(id => apiPut(`/api/notifications/${id}`, { is_read: true }))
      )
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      logger.error('Error marking all as read', error)
    }
  }, [notifications])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string | number) => {
    try {
      await apiDelete(`/api/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      logger.error('Error deleting notification', error)
    }
  }, [])

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '💰'
      case 'withdraw':
        return '💸'
      case 'chat':
        return '💬'
      case 'promotion':
        return '🎁'
      default:
        return '🔔'
    }
  }

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'withdraw':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'chat':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
      case 'promotion':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <Card className="bg-white/60 dark:bg-gray-800/60">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Thông báo
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-600 text-white">
                {unreadCount} mới
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Đánh dấu tất cả đã đọc
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={loadNotifications}
            >
              Làm mới
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Lọc theo loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="system">Hệ thống</SelectItem>
                <SelectItem value="deposit">Nạp tiền</SelectItem>
                <SelectItem value="withdraw">Rút tiền</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="promotion">Khuyến mãi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Tất cả ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Chưa đọc ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Đã đọc ({notifications.length - unreadCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Đang tải...</p>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Không có thông báo nào</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-all ${
                        !notification.is_read
                          ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <Badge className={getNotificationColor(notification.type)}>
                              {notification.type}
                            </Badge>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <h4 className="font-semibold mb-1">{notification.title || 'Thông báo'}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            title="Xóa"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

