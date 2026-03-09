import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

/**
 * Verify admin authentication from cookie
 * Used by client-side to check if admin is still authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    
    return NextResponse.json({
      success: true,
      user: {
        id: 'admin',
        email: admin.email,
        name: 'Admin',
        role: 'admin',
      },
    })
  } catch (error) {
    logger.warn('Admin verification failed', {
      error: error instanceof Error ? error.message : error,
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized',
      },
      { status: 401 }
    )
  }
}
