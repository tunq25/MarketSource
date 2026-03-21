import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { disableUserTwoFactor, getUserByEmail } from "@/lib/database"
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
