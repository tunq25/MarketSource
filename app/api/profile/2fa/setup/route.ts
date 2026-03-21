import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserByEmail, saveUserTwoFactorSecret } from "@/lib/database"
import { generateTwoFactorSecret, generateQRCodeData, generateBackupCodes, verifyTwoFactorToken } from "@/lib/twofactor"
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

    const { email } = await request.json()
    if (!email || email.toLowerCase() !== authUser.email?.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Email không khớp với tài khoản đăng nhập" }, { status: 403 })
    }
    if (!email) {
      return NextResponse.json({ success: false, error: "Thiếu email" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ success: false, error: "Không tìm thấy user" }, { status: 404 })
    }

    const secret = generateTwoFactorSecret(email)
    const qr = await generateQRCodeData(secret.otpauthUrl)

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      otpauthUrl: secret.otpauthUrl,
      qrCode: qr,
    })
  } catch (error: any) {
    logger.error("Setup 2FA failed", error)
    return NextResponse.json(
      { success: false, error: error.message || "Không thể khởi tạo 2FA" },
      { status: 500 }
    )
  }
}
