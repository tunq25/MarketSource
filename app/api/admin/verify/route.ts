import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Verify admin authentication from cookie
 * Used by client-side to check if admin is still authenticated
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)
    // ✅ FIX: Trả về CSRF Token mới mỗi khi Verify thành công để Client setup Header
    const { generateCSRFToken, setCSRFTokenCookie } = await import('@/lib/csrf')
    const csrfToken = generateCSRFToken()
    
    const response = NextResponse.json({
      success: true,
      csrfToken,
      user: {
        id: 'admin',
        email: admin.email,
        name: 'Admin',
        role: 'admin',
      },
    })
    
    // Set CSRF token cookie
    return setCSRFTokenCookie(response, csrfToken)
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
