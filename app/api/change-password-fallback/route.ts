import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from 'bcryptjs'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, currentPassword, newPassword } = await request.json()

    // This is a fallback route for password changes
    // Main logic should be handled client-side with localStorage
    
    // Simple validation
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

    // For demo purposes, return success
    // In real implementation, this would check against database
    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    })

  } catch (error) {
    logger.error('Change password error', error)
    return NextResponse.json({
      success: false,
      error: 'Lỗi hệ thống!'
    }, { status: 500 })
  }
}
