"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, Search, User, Clock } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api-client"
import { logger } from "@/lib/logger-client"

interface Message {
  id: number
  message: string
  isAdmin: boolean
  createdAt: string
  user_name?: string
  user_email?: string
  admin_name?: string
}

interface ChatUser {
  userId: number
  userName: string
  userEmail: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export function ChatAdmin() {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadChatUsers()
    
    // ✅ Realtime polling mỗi 2 giây để load danh sách users và messages
    pollingIntervalRef.current = setInterval(() => {
      loadChatUsers()
      if (selectedUserId) {
        loadChatMessages(selectedUserId)
      }
    }, 2000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [selectedUserId])

  useEffect(() => {
    // Scroll to bottom khi có tin nhắn mới
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const loadChatUsers = async () => {
    try {
      // ✅ Get all chats để lấy danh sách users đã chat
      // Admin có thể xem tất cả chats nên không cần userId param
      const result = await apiGet('/api/chat')
      
      // ✅ Handle API response errors
      if (!result || !result.success) {
        console.warn('Chat API returned error:', result?.error)
        return
      }
      
      const allMessages = result.messages || []

      // Group messages by user_id
      const userMap = new Map<number, ChatUser>()

      allMessages.forEach((msg: any) => {
        const userId = msg.user_id
        if (!userId) return

        if (!userMap.has(userId)) {
          userMap.set(userId, {
            userId,
            userName: msg.user_name || msg.user_email || 'User',
            userEmail: msg.user_email || '',
            unreadCount: 0,
          })
        }

        const user = userMap.get(userId)!
        
        // Update last message
        const msgTime = new Date(msg.created_at || msg.createdAt || msg.timestamp).getTime()
        const lastTime = user.lastMessageTime ? new Date(user.lastMessageTime).getTime() : 0
        
        if (msgTime > lastTime) {
          user.lastMessage = msg.message || msg.content || ''
          user.lastMessageTime = msg.created_at || msg.createdAt || msg.timestamp
        }

        // ✅ Count unread (messages from user, not admin) - chỉ count nếu chưa đọc
        if (!msg.is_admin && !msg.isAdmin) {
          // Chỉ tăng unread nếu message mới hơn last seen
          const lastSeenKey = `lastSeen_${userId}`
          const lastSeen = localStorage.getItem(lastSeenKey)
          if (!lastSeen || msgTime > parseInt(lastSeen)) {
            user.unreadCount++
          }
        }
      })

      const users = Array.from(userMap.values())
        .sort((a, b) => {
          const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
          const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
          return timeB - timeA // Most recent first
        })

      setChatUsers(users)
    } catch (error: any) {
      // ✅ Better error handling
      if (error.message?.includes('Unauthorized')) {
        console.warn('Chat: Admin not authenticated')
      } else {
        logger.error('Error loading chat users:', error)
      }
    }
  }

  const loadChatMessages = async (userId: number) => {
    try {
      const result = await apiGet(`/api/chat?userId=${userId}`)
      
      // ✅ Handle API response errors
      if (!result || !result.success) {
        console.warn('Chat API returned error:', result?.error)
        return
      }
      
      const chatMessages = result.messages || []

      const mappedMessages: Message[] = chatMessages.map((m: any) => ({
        id: m.id,
        message: m.message || m.content || '',
        isAdmin: m.is_admin || m.isAdmin || false,
        createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        user_name: m.user_name,
        user_email: m.user_email,
        admin_name: m.admin_name,
      }))

      // Sort by created_at
      const sortedMessages = mappedMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateA - dateB
      })

      setMessages(sortedMessages)
    } catch (error: any) {
      // ✅ Better error handling
      if (error.message?.includes('Unauthorized')) {
        console.warn('Chat: Admin not authenticated')
      } else {
        logger.error('Error loading chat messages:', error)
      }
    }
  }

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId)
    loadChatMessages(userId)
    // ✅ Reset unread count for this user và update last seen
    setChatUsers(prev => prev.map(u => 
      u.userId === userId ? { ...u, unreadCount: 0 } : u
    ))
    // Update last seen timestamp
    localStorage.setItem(`lastSeen_${userId}`, Date.now().toString())
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || isLoading || !selectedUserId) return

    setIsLoading(true)
    try {
      const result = await apiPost('/api/chat', {
        message: messageText,
        receiverId: selectedUserId
      })

      // Add message to local state immediately
      const newMessage: Message = {
        id: result.message?.id || Date.now(),
        message: messageText,
        isAdmin: true,
        createdAt: result.message?.createdAt || new Date().toISOString(),
        admin_name: 'Admin'
      }

      setMessages(prev => [...prev, newMessage])
      setMessageText("")
      
      // Reload chat history after a short delay
      setTimeout(() => {
        loadChatMessages(selectedUserId)
        loadChatUsers()
      }, 500)
    } catch (error: any) {
      logger.error('Error sending message:', error)
      alert("Lỗi gửi tin nhắn: " + (error.message || "Vui lòng thử lại"))
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = chatUsers.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedUser = chatUsers.find(u => u.userId === selectedUserId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Users List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Khách hàng</span>
            <Badge className="bg-green-500">
              {chatUsers.length} người
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Users List */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có khách hàng nào chat</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    onClick={() => handleSelectUser(user.userId)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedUserId === user.userId
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="font-semibold text-sm">{user.userName}</p>
                          {user.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">
                              {user.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{user.userEmail}</p>
                        {user.lastMessage && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {user.lastMessage}
                          </p>
                        )}
                        {user.lastMessageTime && (
                          <p className="text-xs text-gray-400 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(user.lastMessageTime).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="lg:col-span-2">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardTitle className="flex items-center justify-between">
            {selectedUser ? (
              <>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat với {selectedUser.userName}</span>
                </div>
                <Badge className="bg-green-500">Online</Badge>
              </>
            ) : (
              <span>Chọn khách hàng để bắt đầu chat</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {selectedUser ? (
            <>
              {/* Messages Area */}
              <ScrollArea className="h-[500px] p-4">
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.isAdmin
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-gray-900 dark:text-gray-100'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-70">
                            {msg.isAdmin ? 'Bạn (Admin)' : msg.user_name || msg.user_email || 'Khách hàng'}
                          </p>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className="text-xs opacity-50 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="border-t p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Nhập tin nhắn..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Nhấn Enter để gửi, Shift+Enter để xuống dòng
                </p>
              </div>
            </>
          ) : (
            <div className="h-[600px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-semibold mb-2">Chưa chọn khách hàng</p>
                <p className="text-sm">Chọn một khách hàng từ danh sách bên trái để bắt đầu chat</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

