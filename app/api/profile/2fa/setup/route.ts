import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/database-mysql"
import { generateTwoFactorSecret, generateQRCodeData } from "@/lib/twofactor"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
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
