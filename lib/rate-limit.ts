/**
 * Rate Limiting using Upstash Redis
 * Fallback to in-memory rate limiting if Redis is not available
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// In-memory fallback
const memoryStore = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimitMemory(
  identifier: string,
  limit: number,
  window: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = identifier
  const record = memoryStore.get(key)

  if (!record || now > record.resetTime) {
    // Reset window
    memoryStore.set(key, { count: 1, resetTime: now + window * 1000 })
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + window * 1000,
    }
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    }
  }

  record.count++
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  }
}

// Upstash Redis rate limiting
let ratelimit: any = null

async function getRatelimit() {
  if (ratelimit) return ratelimit

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      // console.warn('Upstash Redis not configured, using in-memory rate limiting')
      return null
    }

    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
    })

    return ratelimit
  } catch (error: any) {
    // ✅ FIX: Chỉ log warning nếu không phải lỗi auth (WRONGPASS)
    if (error?.message?.includes('WRONGPASS') || error?.message?.includes('invalid or missing auth token')) {
      // Upstash credentials không đúng, fallback về memory - không cần log nhiều
      // console.warn('Upstash Redis credentials invalid, using in-memory rate limiting');
    } else {
      // console.warn('Upstash not available, using in-memory rate limiting:', error?.message || error);
    }
    return null
  }
}

export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  window: number = 10
): Promise<RateLimitResult> {
  const ratelimitInstance = await getRatelimit()

  if (!ratelimitInstance) {
    return checkRateLimitMemory(identifier, limit, window)
  }

  try {
    const result = await ratelimitInstance.limit(identifier)
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error: any) {
    // ✅ FIX: Chỉ log warning nếu không phải lỗi auth (WRONGPASS)
    // Upstash Redis có thể không available trong development, đây là bình thường
    if (!error?.message?.includes('WRONGPASS') && !error?.message?.includes('invalid or missing auth token')) {
      // console.warn('Rate limit error, falling back to memory:', error?.message || error);
    }
    return checkRateLimitMemory(identifier, limit, window)
  }
}

// Cleanup old entries from memory store (run periodically)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    // Use Array.from to avoid TypeScript iteration issues
    Array.from(memoryStore.entries()).forEach(([key, record]) => {
      if (now > record.resetTime) {
        memoryStore.delete(key)
      }
    })
  }, 60000) // Cleanup every minute
}

function getIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

// Helper function to check rate limit and return response if exceeded
export async function checkRateLimitAndRespond(
  request: NextRequest,
  limit: number = 10,
  window: number = 10,
  identifierPrefix: string = 'api'
): Promise<NextResponse | null> {
  const identifier = `${identifierPrefix}:${getIdentifier(request)}`
  const result = await checkRateLimit(identifier, limit, window)

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.reset.toString(),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }

  return null
}