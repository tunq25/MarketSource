import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/api-auth'
import { getUserIdByEmail, query } from '@/lib/database-mysql'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * DELETE /api/sessions/[id]
 * Revoke (delete) a specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const authUser = await verifyFirebaseToken(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await getUserIdByEmail(authUser.email || '')
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Xóa session thuộc về user này
    const result = await query(
      'DELETE FROM user_sessions WHERE id = ? AND user_id = ?',
      [id, dbUserId]
    )

    const affectedRows = (result as any).affectedRows || 0
    if (affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Session not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Session revoked' })
  } catch (error: any) {
    logger.error('Session Revoke error', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/sessions/[id]/trust
 * Mark a session as trusted
 * Note: Our page.tsx calls /api/sessions/${sessionId}/trust
 * So we handle it here or by checking the path
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const authUser = await verifyFirebaseToken(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const dbUserId = await getUserIdByEmail(authUser.email || '')
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Cập nhật is_trusted
    const result = await query(
      'UPDATE user_sessions SET is_trusted = 1 WHERE id = ? AND user_id = ?',
      [id, dbUserId]
    )

    const affectedRows = (result as any).affectedRows || 0
    if (affectedRows === 0) {
      return NextResponse.json({ success: false, error: 'Session not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Session marked as trusted' })
  } catch (error: any) {
    logger.error('Session Trust error', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
