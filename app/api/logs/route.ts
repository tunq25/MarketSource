import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
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
