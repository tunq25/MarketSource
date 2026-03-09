/**
 * Notification Types & Interfaces
 */

export interface Notification {
  id: number | string
  userId: number | string
  type: 'system' | 'deposit' | 'withdraw' | 'chat' | 'promotion' | 'purchase' | 'review'
  title?: string | null
  message: string
  isRead: boolean
  created_at?: string | Date
  updated_at?: string | Date
  link?: string | null
  metadata?: Record<string, unknown> | null
}

export interface SupportTicket {
  id: number | string
  userId: number | string
  subject: string
  category: 'product' | 'payment' | 'technical' | 'account' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  message: string
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | string
  created_at?: string | Date
  createdAt?: string | Date
  updated_at?: string | Date
  updatedAt?: string | Date
  messages?: ChatMessage[]
}

export interface ChatMessage {
  id: number | string
  userId: number | string
  adminId?: number | string | null
  ticketId?: number | string | null
  message: string
  isAdmin: boolean
  created_at?: string | Date
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

