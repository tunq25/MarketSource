import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, requireAdmin } from '@/lib/api-auth';
import { getReviewsAdmin } from '@/lib/database';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin role
    const adminCheck = await requireAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const reviews = await getReviewsAdmin();
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error: any) {
    logger.error('Admin Review GET error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
