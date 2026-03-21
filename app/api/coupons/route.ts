import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/api-auth';
import { getUserIdByEmail, query } from '@/lib/database';
import { checkRateLimitAndRespond } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/coupons
 * Lấy danh sách coupons của user
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 20, 10, 'coupons-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const userId = await getUserIdByEmail(authUser.email || '');
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Lấy danh sách coupons có sẵn (active và chưa hết hạn)
    const coupons = await query<any>(`
      SELECT 
        c.*,
        CASE 
          WHEN uc.id IS NOT NULL THEN 'used'
          WHEN c.valid_until < NOW() THEN 'expired'
          WHEN c.valid_from > NOW() THEN 'expired'
          WHEN c.is_active = FALSE THEN 'expired'
          ELSE 'available'
        END as status,
        uc.used_at
      FROM coupons c
      LEFT JOIN user_coupons uc ON c.id = uc.coupon_id AND uc.user_id = $1
      WHERE c.is_active = TRUE
        AND (c.valid_from IS NULL OR c.valid_from <= NOW())
        AND (c.valid_until IS NULL OR c.valid_until >= NOW())
      ORDER BY c.created_at DESC
    `, [userId]);

    // Map kết quả về format chuẩn
    const mappedCoupons = coupons.map((coupon: any) => ({
      id: coupon.id,
      code: coupon.code,
      name: coupon.name || coupon.title || coupon.code,
      description: coupon.description || '',
      type: coupon.discount_type === 'percentage' ? 'percentage' : 'fixed',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value || 0,
      min_purchase_amount: coupon.min_purchase_amount || 0,
      max_discount_amount: coupon.max_discount_amount || null,
      status: coupon.status,
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString() : null,
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString() : null,
      used_at: coupon.used_at ? new Date(coupon.used_at).toISOString() : null,
      created_at: coupon.created_at ? new Date(coupon.created_at).toISOString() : null,
    }));

    return NextResponse.json({
      success: true,
      coupons: mappedCoupons,
      data: mappedCoupons, // Backward compatibility
    });
  } catch (error: any) {
    logger.error('Coupons GET error', error, { endpoint: '/api/coupons' });

    // Nếu table không tồn tại, trả về empty array
    if (error.message?.includes("doesn't exist") || error.message?.includes("Unknown table")) {
      logger.warn('Coupons table does not exist, returning empty array');
      return NextResponse.json({
        success: true,
        coupons: [],
        data: [],
      });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

