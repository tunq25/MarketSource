import { NextRequest, NextResponse } from "next/server"
import { verifyFirebaseToken } from "@/lib/api-auth"
import { getUserPurchases } from "@/lib/services/orders"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await verifyFirebaseToken(request)
  if (!user?.uid) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const purchases = await getUserPurchases(user.uid, 50, user.email)
  return NextResponse.json({ success: true, data: purchases })
}

