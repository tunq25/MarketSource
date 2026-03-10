import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

/**
 * ✅ FIX: Change Password - Xác thực mật khẩu hiện tại và đổi mật khẩu mới
 * KHÔNG CÒN FAKE - thực sự check và update password trong database
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 5, 60, 'change-password');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, currentPassword, newPassword } = await request.json()

    // Validation
    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng điền đầy đủ thông tin!'
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự!'
      }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Mật khẩu mới phải khác mật khẩu hiện tại!'
      }, { status: 400 })
    }

    // ✅ FIX: Tìm user trong database và verify mật khẩu hiện tại
    const { getUserByEmail, updateUserPasswordHash } = await import('@/lib/database-mysql')
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Tài khoản không tồn tại!'
      }, { status: 404 })
    }

    if (!user.password_hash) {
      return NextResponse.json({
        success: false,
        error: 'Tài khoản chưa thiết lập mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.'
      }, { status: 400 })
    }

    // ✅ Verify mật khẩu hiện tại
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password_hash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({
        success: false,
        error: 'Mật khẩu hiện tại không chính xác!'
      }, { status: 401 })
    }

    // ✅ Hash mật khẩu mới và update trong database
    const newPasswordHash = await bcryptjs.hash(newPassword, 10)
    await updateUserPasswordHash(user.id, newPasswordHash)

    logger.info('Password changed successfully', { userId: user.id, email })

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    })

  } catch (error) {
    logger.error('Change password error', error)
    return NextResponse.json({
      success: false,
      error: 'Lỗi hệ thống! Vui lòng thử lại.'
    }, { status: 500 })
  }
}
