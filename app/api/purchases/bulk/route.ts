import { NextRequest, NextResponse } from "next/server"
import { normalizeUserId, getProductById, createPurchase, query, queryOne, createBulkPurchase } from "@/lib/database"
import { verifyFirebaseToken, requireEmailVerifiedForUser } from "@/lib/api-auth"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * ✅ BUG #26 FIX: Bulk Purchase API
 * Xử lý nhiều sản phẩm trong 1 transaction để tránh N+1 Query và Race Condition
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ev = await requireEmailVerifiedForUser(authUser);
    if (ev) return ev;

    const body = await request.json();
    const { items } = body;
    // ✅ SECURITY FIX: KHÔNG tin userId từ client, chỉ dùng session

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Giỏ hàng trống hoặc dữ liệu không hợp lệ' }, { status: 400 });
    }

    const dbUserId = await normalizeUserId(authUser.uid, authUser.email || undefined);
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ✅ Thực hiện thanh toán hàng loạt trong 1 transaction atomic
    const result = await createBulkPurchase({
      userId: dbUserId,
      items: items.map((it: any) => ({
        id: it.id,
        quantity: Math.max(1, Number(it.quantity) || 1)
      })),
      userEmail: authUser.email || undefined
    });

    return NextResponse.json({
      success: true,
      purchaseIds: result.purchaseIds,
      newBalance: result.newBalance
    });

  } catch (error: any) {
    logger.error('Bulk Purchase Error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
