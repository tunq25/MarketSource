import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserPurchases } from "@/lib/services/orders"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await verifyFirebaseToken(request)
    if (!user?.uid) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const purchases = await getUserPurchases(user.uid, 50, user.email)
    return NextResponse.json({ success: true, data: purchases, orders: purchases })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error"
    console.error("[API] /api/dashboard/orders error:", message)
    return NextResponse.json(
      { success: false, error: message, data: [], orders: [] },
      { status: 500 }
    )
  }
}

