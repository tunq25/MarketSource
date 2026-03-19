import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // ✅ BUG #14 FIX: Rate limiting + Auth for logs
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request as any, 10, 60, 'client-logs');
    if (rateLimitResponse) return rateLimitResponse;

    const { verifyFirebaseToken } = await import('@/lib/api-auth');
    const authUser = await verifyFirebaseToken(request as any).catch(() => null);
    if (!authUser) {
       // Optional: Log but limit unauthenticated logging
       // To simplify, we keep rate limit but don't strictly block yet to allow error reporting from login page
    }

    const body = await request.json()
    const { level, message, metadata } = body

    // Log với server-side logger
    const context = metadata || {}
    if (level === 'error') {
      logger.error(message, undefined, context)
    } else if (level === 'warn') {
      logger.warn(message, context)
    } else {
      logger.info(message, context)
    }

    // Trong production, có thể gửi đến:
    // - Sentry
    // - Firebase Analytics
    // - Custom logging service
    // - Database logging
    
    return NextResponse.json({
      success: true,
      message: 'Log đã được ghi nhận'
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Log API error', error, { endpoint: '/api/logs' })
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
