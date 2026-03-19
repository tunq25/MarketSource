import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserByEmail, saveUserTwoFactorSecret } from "@/lib/database-mysql"
import { generateBackupCodes, verifyTwoFactorToken } from "@/lib/twofactor"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // ✅ BUG #12 FIX: Check authentication
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { email, token, secret } = await request.json()
    if (!email || email.toLowerCase() !== authUser.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Email không khớp với tài khoản đăng nhập" }, { status: 403 })
    }
    if (!email || !token || !secret) {
      return NextResponse.json(
        { success: false, error: "Thiếu email, mã xác thực hoặc secret" },
        { status: 400 }
      )
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ success: false, error: "Không tìm thấy user" }, { status: 404 })
    }

    const isValid = verifyTwoFactorToken(secret, token)
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Mã OTP không hợp lệ" }, { status: 400 })
    }

    const backupCodes = generateBackupCodes()
    await saveUserTwoFactorSecret(user.id, secret, backupCodes)

    return NextResponse.json({ success: true, backupCodes })
  } catch (error: any) {
    logger.error("Verify 2FA failed", error)
    return NextResponse.json(
      { success: false, error: error.message || "Không thể kích hoạt 2FA" },
      { status: 500 }
    )
  }
}
