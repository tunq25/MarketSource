import { NextRequest, NextResponse } from "next/server"
import { disableUserTwoFactor, getUserByEmail } from "@/lib/database-mysql"
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

    await disableUserTwoFactor(user.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error("Disable 2FA failed", error)
    return NextResponse.json(
      { success: false, error: error.message || "Không thể tắt 2FA" },
      { status: 500 }
    )
  }
}
