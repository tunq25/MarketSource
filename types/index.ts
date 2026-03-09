/**
 * Centralized Type Exports
 * Import tất cả types từ đây
 */

export * from './user'
export * from './product'
export * from './transaction'
export * from './notification'
export * from './device'
export * from './coupon'

// Common utility types
export type ID = number | string
export type Timestamp = string | Date
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'banned' | 'failed'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

