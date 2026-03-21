import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserById, getUserIdByEmail } from "@/lib/database"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/get-balance
 * Lấy số dư thực tế của user từ database (PostgreSQL)
 * Dùng để sync sau các hành động quan trọng
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Xác thực user
    const authUser = await verifyFirebaseToken(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 2. Lấy DB ID từ email
    const dbUserId = await getUserIdByEmail(authUser.email || "")
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // 3. Lấy data từ DB
    const user = await getUserById(dbUserId)
    if (!user) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      balance: parseFloat(String(user.balance || 0)),
      role: user.role
    })
  } catch (error: any) {
    logger.error("Get balance API error", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
