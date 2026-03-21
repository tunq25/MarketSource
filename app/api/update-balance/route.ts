import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { requireAdmin, getClientIP } from '@/lib/api-auth'

export const runtime = 'nodejs'

/**
 * PUT /api/update-balance
 * Cập nhật balance của user trong PostgreSQL.
 * Chỉ admin và internal server mới được gọi.
 */
export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request)

    const body = await request.json()
    const { userId, userEmail, newBalance } = body

    if (!newBalance && newBalance !== 0) {
      return NextResponse.json({ error: 'newBalance is required' }, { status: 400 })
    }

    if (typeof newBalance !== 'number' || newBalance < 0) {
      return NextResponse.json({ error: 'newBalance must be a non-negative number' }, { status: 400 })
    }

    // Resolve userId từ email nếu cần
    let dbUserId: number | null = null
    if (typeof userId === 'number') {
      dbUserId = userId
    } else if (userEmail) {
      const { getUserIdByEmail } = await import('@/lib/database')
      dbUserId = await getUserIdByEmail(userEmail)
    }

    if (!dbUserId) {
      return NextResponse.json({ error: 'Cannot resolve user ID' }, { status: 400 })
    }

    const { query, getUserById } = await import('@/lib/database')
    const before = await getUserById(dbUserId)
    const oldBalance = before?.balance != null ? Number(before.balance) : null

    await query(
      'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newBalance, dbUserId]
    )

    try {
      const { logAdminAction, resolveAdminIdForAudit } = await import('@/lib/audit-logger')
      const adminId = await resolveAdminIdForAudit({
        email: admin.email,
        uid: (admin as { uid?: string }).uid,
      })
      await logAdminAction({
        adminId,
        adminEmail: admin.email || undefined,
        action: 'BALANCE_SET',
        targetType: 'user',
        targetId: dbUserId,
        details: { oldBalance, newBalance },
        ipAddress: getClientIP(request),
      })
    } catch {
      /* non-critical */
    }

    logger.info('Balance updated via API', { dbUserId, newBalance })

    return NextResponse.json({ success: true, newBalance })
  } catch (error: any) {
    logger.error('Update balance error', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
