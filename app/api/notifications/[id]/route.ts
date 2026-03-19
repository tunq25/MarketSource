import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserIdByEmail, query, queryOne } from "@/lib/database-mysql"

export const runtime = 'nodejs'

// PUT: Update notification (mark as read/unread)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params
    const authUser = await verifyFirebaseToken(request)
    const { requireAdmin } = await import('@/lib/api-auth')
    const isAdmin = await requireAdmin(request).catch(() => false)

    if (!authUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { getUserIdByEmail } = await import('@/lib/database-mysql')
    const userEmail = authUser?.email || (isAdmin as any)?.email || ''
    const userId = await getUserIdByEmail(userEmail)
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { is_read } = body

    // Update notification
    await query(
      `UPDATE notifications 
       SET is_read = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [is_read ? 1 : 0, routeParams.id, userId]
    )

    const notification = await queryOne<any>(
      "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
      [routeParams.id, userId]
    )

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      notification
    })
  } catch (error: any) {
    const { logger } = await import('@/lib/logger')
    logger.error('Notification PUT error', error, { endpoint: '/api/notifications/[id]' })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const routeParams = await params
    const authUser = await verifyFirebaseToken(request)
    const { requireAdmin } = await import('@/lib/api-auth')
    const isAdmin = await requireAdmin(request).catch(() => false)

    if (!authUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { getUserIdByEmail } = await import('@/lib/database-mysql')
    const userEmail = authUser?.email || (isAdmin as any)?.email || ''
    const userId = await getUserIdByEmail(userEmail)
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete notification
    await query(
      `UPDATE notifications 
       SET deleted_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [routeParams.id, userId]
    )

    const notification = await queryOne<any>(
      "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
      [routeParams.id, userId]
    )

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })
  } catch (error: any) {
    const { logger } = await import('@/lib/logger')
    logger.error('Notification DELETE error', error, { endpoint: '/api/notifications/[id]' })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
