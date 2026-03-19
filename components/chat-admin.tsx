"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Search, User, Clock, Check, CheckCheck, Bot, UserCog, Sparkles } from "lucide-react"
import { apiGet, apiPost } from "@/lib/api-client"
import { logger } from "@/lib/logger-client"

interface Message {
  id: number
  message: string
  isAdmin: boolean
  senderType?: 'user' | 'admin' | 'ai'
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

  const loadChatUsers = useCallback(async () => {
    try {
      // ✅ FIX: Lấy TOÀN BỘ user từ DB + Lấy lịch sử chat
      const [chatResult, usersResult] = await Promise.all([
        apiGet('/api/chat').catch(() => null),
        apiGet('/api/users').catch(() => null)
      ])

      const allMessages = chatResult?.messages || []
      const allUsers = usersResult?.users || usersResult?.data || []
      
      const userMap = new Map<number, ChatUser>()

      // 1. Map toàn bộ users trước tiên
      if (Array.isArray(allUsers)) {
        allUsers.forEach((u: any) => {
          const userId = u.id || u.uid || u.user_id
          if (!userId) return

          userMap.set(userId, {
            userId: Number(userId),
            userName: u.name || u.username || u.email || 'User',
            userEmail: u.email || '',
            unreadCount: 0,
            lastMessage: '',
            lastMessageTime: '',
          })
        })
      }

      // 2. Gộp lịch sử tin nhắn vào userMap
      allMessages.forEach((msg: any) => {
        const userId = Number(msg.user_id)
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
        const msgTime = new Date(msg.created_at || msg.createdAt || msg.timestamp).getTime()
        const lastTime = user.lastMessageTime ? new Date(user.lastMessageTime).getTime() : 0

        if (msgTime > lastTime) {
          user.lastMessage = msg.message || msg.content || ''
          user.lastMessageTime = msg.created_at || msg.createdAt || msg.timestamp
        }

        if (!msg.is_admin && !msg.isAdmin) {
          const lastSeenKey = `lastSeen_${userId}`
          const lastSeen = localStorage.getItem(lastSeenKey)
          if (!lastSeen || msgTime > parseInt(lastSeen)) {
            user.unreadCount++
          }
        }
      })

      // Sort: Những người có tin nhắn gần nhất lên đầu. Chưa có tin nhắn thì xếp bảng chữ cái.
      setChatUsers(Array.from(userMap.values()).sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        if (timeA === 0 && timeB === 0) {
          return a.userName.localeCompare(b.userName)
        }
        return timeB - timeA
      }))
    } catch (error) {
      console.error('Error loading users', error)
    }
  }, [])

  const loadChatMessages = useCallback(async (userId: number) => {
    try {
      const result = await apiGet(`/api/chat?userId=${userId}`)
      if (!result || !result.success) return

      const chatMessages = result.messages || []
      const mappedMessages: Message[] = chatMessages.map((m: any) => ({
        id: m.id,
        message: m.message || '',
        isAdmin: m.senderType === 'admin' || m.senderType === 'ai' || m.isAdmin === true || m.is_admin === true,
        senderType: m.senderType,
        createdAt: m.created_at || m.createdAt || new Date().toISOString(),
        user_name: m.user_name,
        user_email: m.user_email,
        admin_name: m.admin_name,
      }))

      setMessages(mappedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()))
    } catch (error) {
      console.error('Error loading messages', error)
    }
  }, [])

  useEffect(() => {
    loadChatUsers()
    pollingIntervalRef.current = setInterval(() => {
      loadChatUsers()
      if (selectedUserId) loadChatMessages(selectedUserId)
    }, 3000)

    return () => { if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current) }
  }, [selectedUserId, loadChatUsers, loadChatMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId)
    localStorage.setItem(`lastSeen_${userId}`, Date.now().toString())
    loadChatMessages(userId)
    setChatUsers(prev => prev.map(u => u.userId === userId ? { ...u, unreadCount: 0 } : u))
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || isLoading || !selectedUserId) return

    const text = messageText
    setMessageText("")
    setIsLoading(true)

    try {
      await apiPost('/api/chat', { message: text, receiverId: selectedUserId })
      loadChatMessages(selectedUserId)
    } catch (error) {
      logger.error('Error sending message', error)
    } finally {
      setIsLoading(true) // Giữ loading ngắn để UI mượt
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  const filteredUsers = chatUsers.filter(user =>
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedUser = chatUsers.find(u => u.userId === selectedUserId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-250px)] min-h-[600px]">
      {/* Users List - 4 columns */}
      <Card className="lg:col-span-4 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden glass-panel flex flex-col">
        <CardHeader className="p-4 border-b border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-500" />
              <span>Khách hàng</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none">
              {chatUsers.length}
            </Badge>
          </CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 h-10 rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredUsers.length === 0 ? (
                <div className="py-20 text-center opacity-30">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-xs">Chưa có ai nhắn tin</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.userId}
                    onClick={() => handleSelectUser(user.userId)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center gap-3 active:scale-[0.98] ${selectedUserId === user.userId
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-l-4 border-blue-500 shadow-inner'
                      : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold shrink-0">
                      {user.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm truncate">{user.userName}</p>
                        {user.unreadCount > 0 && (
                          <span className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                            {user.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate opacity-60">
                        {user.lastMessage || user.userEmail}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area - 8 columns */}
      <Card className="lg:col-span-8 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden glass-panel flex flex-col relative">
        {selectedUser ? (
          <>
            <CardHeader className="p-4 border-b border-white/5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">{selectedUser.userName}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Đang trực tuyến</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden md:block text-right mr-3 group">
                    <p className="text-[10px] font-bold opacity-40 group-hover:opacity-100 transition-opacity uppercase">Email Khách hàng</p>
                    <p className="text-xs font-medium opacity-60 group-hover:opacity-100">{selectedUser.userEmail}</p>
                  </div>
                  <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={() => loadChatMessages(selectedUser.userId)}>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden bg-slate-900/10">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20 italic">
                      <MessageCircle className="w-12 h-12 mb-2" />
                      <p className="text-sm">Hãy bắt đầu cuộc trò chuyện...</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAI = msg.senderType === 'ai' || msg.message.startsWith('🤖');
                      const isMe = msg.isAdmin;

                      return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              {!isMe && <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">{msg.user_name || msg.user_email || 'Khách'}</span>}
                              {isAI && <Bot className="w-3 h-3 text-purple-400" />}
                              {isMe && !isAI && <span className="text-[10px] font-bold opacity-40 uppercase tracking-tighter">Bạn (Admin)</span>}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe
                              ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none'
                              : isAI
                                ? 'bg-purple-500/10 border border-purple-500/20 text-purple-800 dark:text-purple-200 rounded-tl-none'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                              }`}>
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.message.replace(/^🤖 /, '')}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 px-1 opacity-40 scale-[0.8] origin-right">
                              <span className="text-[9px] font-medium">
                                {new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-white/5 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-md">
                <div className="flex items-end gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 focus-within:border-blue-500/50 transition-all shadow-inner">
                  <Textarea
                    placeholder="Viết câu trả lời của bạn..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    rows={1}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 resize-none min-h-[44px] max-h-[120px] py-3 px-4"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || isLoading}
                    className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 mb-0.5"
                  >
                    {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2 px-1">
                  <p className="text-[10px] text-muted-foreground opacity-40">Shift + Enter để xuống dòng</p>
                  <p className="text-[10px] text-muted-foreground opacity-40">AI sẽ tự động phản hồi nếu tin nhắn mới từ khách</p>
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 p-10 text-center">
            <div className="w-24 h-24 rounded-full bg-slate-500/10 flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">Trung tâm Chăm sóc Khách hàng</h3>
            <p className="max-w-[300px] text-sm leading-relaxed">Chọn một khách hàng từ danh sách bên trái để phản hồi thắc mắc và hỗ trợ trực tuyến.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

