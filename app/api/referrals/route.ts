import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/api-auth';
import { getUserIdByEmail, query, queryOne } from '@/lib/database-mysql';
import { checkRateLimitAndRespond } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/referrals
 * Lấy thống kê referral của user
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 20, 10, 'referrals-get');
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

    try {
      // Lấy danh sách người được giới thiệu
      const referrals = await query<any>(`
        SELECT 
          r.*,
          u.email as referred_email,
          u.name as referred_name,
          u.created_at as referred_joined_at
        FROM referrals r
        LEFT JOIN users u ON r.referred_id = u.id
        WHERE r.referrer_id = ?
        ORDER BY r.created_at DESC
      `, [userId]);

      // Tính tổng hoa hồng
      const totalCommission = referrals.reduce((sum: number, ref: any) => {
        return sum + (Number(ref.total_earnings) || 0);
      }, 0);

      // Tính hoa hồng đang chờ duyệt (status = 'pending')
      const pendingCommission = referrals
        .filter((ref: any) => ref.status === 'pending')
        .reduce((sum: number, ref: any) => {
          return sum + (Number(ref.total_earnings) || 0);
        }, 0);

      // Lấy referral code của user (có thể là uid hoặc id)
      const user = await queryOne<any>(`
        SELECT id, uid, email, referral_code 
        FROM users 
        WHERE id = ?
      `, [userId]);

      const referralCode = user?.referral_code || user?.uid || String(userId);

      // Map kết quả về format chuẩn
      const mappedReferrals = referrals.map((ref: any) => ({
        id: ref.id,
        email: ref.referred_email || '',
        name: ref.referred_name || '',
        status: ref.status || 'pending',
        joinedAt: ref.referred_joined_at 
          ? (typeof ref.referred_joined_at === 'string' 
              ? ref.referred_joined_at 
              : new Date(ref.referred_joined_at).toISOString())
          : (ref.created_at 
              ? (typeof ref.created_at === 'string' 
                  ? ref.created_at 
                  : new Date(ref.created_at).toISOString())
              : new Date().toISOString()),
        commission: Number(ref.total_earnings) || 0,
        commissionPercent: Number(ref.commission_percent) || 10,
        createdAt: ref.created_at 
          ? (typeof ref.created_at === 'string' 
              ? ref.created_at 
              : new Date(ref.created_at).toISOString())
          : null,
      }));

      return NextResponse.json({
        success: true,
        referrals: mappedReferrals,
        data: mappedReferrals, // Backward compatibility
        referralCode,
        totalCommission,
        pendingCommission,
      });
    } catch (error: any) {
      // Nếu table referrals không tồn tại, trả về empty data
      if (error.message?.includes("doesn't exist") || error.message?.includes("Unknown table")) {
        logger.warn('Referrals table does not exist, returning empty data');
        
        const user = await queryOne<any>(`
          SELECT id, uid, email, referral_code 
          FROM users 
          WHERE id = ?
        `, [userId]);

        const referralCode = user?.referral_code || user?.uid || String(userId);

        return NextResponse.json({
          success: true,
          referrals: [],
          data: [],
          referralCode,
          totalCommission: 0,
          pendingCommission: 0,
        });
      }
      
      throw error;
    }
  } catch (error: any) {
    logger.error('Referrals GET error', error, { endpoint: '/api/referrals' });
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

