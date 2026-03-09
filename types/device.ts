/**
 * Device Types & Interfaces
 */

export interface DeviceSession {
  id: string | number
  userId?: number | string
  deviceName?: string
  deviceType?: string
  browser?: string
  os?: string
  deviceInfo?: {
    userAgent?: string
    platform?: string
    language?: string
    deviceType?: string
    browser?: string
    os?: string
  }
  ipAddress?: string
  location?: string
  lastActivity: string | Date
  createdAt?: string | Date
  isCurrent?: boolean
  isTrusted?: boolean
}

