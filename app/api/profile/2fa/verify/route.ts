import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, saveUserTwoFactorSecret } from "@/lib/database-mysql"
import { generateBackupCodes, verifyTwoFactorToken } from "@/lib/twofactor"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, token, secret } = await request.json()
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
