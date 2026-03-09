import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateUser } from '@/lib/database-mysql'
import { logger } from '@/lib/logger'
import { requireAdmin } from '@/lib/api-auth'
import { checkRateLimitAndRespond } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimitAndRespond(request, 5, 60, 'save-users')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    await requireAdmin(request)

    const body = await request.json()
    const { users } = body

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Danh sách người dùng không hợp lệ!' },
        { status: 400 }
      )
    }

    let savedCount = 0
    for (const user of users) {
      if (!user?.email) {
        continue
      }

      await createOrUpdateUser({
        email: user.email,
        name: user.name || user.displayName || user.username,
        username: user.username,
        avatarUrl: user.avatarUrl || user.image || user.avatar_url,
        ipAddress: user.ipAddress || user.ip || user.lastActiveIp,
        role: user.role || 'user',
      })
      savedCount += 1
    }

    return NextResponse.json({
      success: true,
      message: 'Lưu danh sách người dùng thành công!',
      count: savedCount,
    })
  } catch (error: any) {
    logger.error('Save users error', error, { endpoint: '/api/save-users' })
    return NextResponse.json(
      { error: error.message || 'Lỗi khi lưu danh sách người dùng!' },
      { status: 500 }
    )
  }
}
