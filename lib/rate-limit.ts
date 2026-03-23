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
  if (ratelimit !== null) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url,
      token,
    });

    ratelimit = new Ratelimit({
      redis,
      // Default limiter, will be overridden or used as base
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      /**
       * Optional prefix for the keys used in redis. This is useful if you want to share a redis
       * instance with other applications and want to avoid key collisions. The default prefix is
       * @upstash/ratelimit
       */
      prefix: '@upstash/ratelimit',
    });
    
    return ratelimit;
  } catch (error) {
    // console.warn('Failed to initialize Upstash Redis ratelimit', error);
    return null;
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
    // Create a dynamic override for the specific window and limit if they differ
    // Note: Upstash doesn't easily allow dynamic changing of limits per request on the same Ratelimit instance,
    // so we re-instantiate locally if needed, or we just rely on the default if it matches.
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    
    let specificLimit = ratelimitInstance;
    
    // If we have custom limits, instantiate temporarily
    if (url && token && (limit !== 10 || window !== 10)) {
        const { Ratelimit } = await import('@upstash/ratelimit');
        const { Redis } = await import('@upstash/redis');
        const redis = new Redis({ url, token });
        specificLimit = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(limit, `${window} s`),
            analytics: false,
            prefix: `@upstash/ratelimit/dyn_${limit}_${window}`,
        });
    }

    const result = await Promise.race([
      specificLimit.limit(identifier),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Rate limit timeout')), 5000))
    ])
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
  identifierPrefix: string = 'api',
  userId?: string | number
): Promise<NextResponse | null> {
  const ip = getIdentifier(request)
  const identifier = userId 
    ? `${identifierPrefix}:user:${userId}` 
    : `${identifierPrefix}:ip:${ip}`
    
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