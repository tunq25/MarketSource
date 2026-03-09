import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database-mysql'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/api-auth'
import { checkRateLimitAndRespond } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 60, 'get-users')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAdmin(request)

    const rows = await query<any>(`
      SELECT 
        id,
        email,
        name,
        username,
        avatar_url,
        balance,
        role,
        last_login,
        created_at,
        updated_at,
        ip_address as last_active_ip,
        provider,
        login_count
      FROM users
      ORDER BY created_at DESC
      LIMIT 500
    `)

    const users = rows.map((user) => ({
      ...user,
      avatarUrl: user.avatar_url,
      lastActivity: user.last_login,
      ipAddress: user.last_active_ip,
    }))

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    logger.error('Get users error', error, { endpoint: '/api/get-users' })
    return NextResponse.json(
      { error: error.message || 'Lỗi khi lấy danh sách người dùng!' },
      { status: 500 }
    )
  }
}
