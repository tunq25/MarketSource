import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken, requireAdmin } from '@/lib/api-auth';
import { updateReviewStatus, createNotification } from '@/lib/database';
import { sendReviewThankYouEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const adminCheck = await requireAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    
    const reviewId = parseInt(params.id);
    const body = await request.json().catch(() => ({}));
    const { action, adminResponse } = body; // action: 'approve' | 'reject'
    
    if (isNaN(reviewId)) {
      return NextResponse.json({ success: false, error: 'Invalid review ID' }, { status: 400 });
    }
    
    const status = action === 'approve' ? 'published' : 'rejected';
    
    const updatedReview = await updateReviewStatus(reviewId, status, adminResponse);
    
    if (!updatedReview) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }
    
    // If approved, send notification and email
    if (status === 'published') {
      try {
        // Fetch user email and product title if not in updatedReview directly (it's not, we need a join or separate fetch if needed, 
        // but updateReviewStatus returns the raw row. Let's assume we need to join back or use what we have.)
        // For simplicity, let's look at getReviewsAdmin result to see what fields we have or fetch user info.
        
        // Let's do a quick fetch for user and product info since we need them for notifications/emails
        const { queryOne } = await import('@/lib/database');
        const info = await queryOne<any>(`
          SELECT u.email, u.id as user_id, p.title as product_title 
          FROM reviews r 
          JOIN users u ON r.user_id = u.id 
          JOIN products p ON r.product_id = p.id 
          WHERE r.id = $1
        `, [reviewId]);
        
        if (info) {
          // Dashboard Notification
          await createNotification({
            userId: info.user_id,
            type: 'review_approved',
            title: 'Đánh giá đã được duyệt',
            message: `Đánh giá của bạn cho sản phẩm "${info.product_title}" đã được duyệt thành công. Cám ơn bạn!`
          });
          
          // Email
          await sendReviewThankYouEmail(info.email, info.product_title);
        }
      } catch (err) {
        logger.error('Error sending approval notifications', err);
        // Don't fail the whole request if notification fails
      }
    }
    
    return NextResponse.json({
      success: true,
      review: updatedReview
    });
  } catch (error: any) {
    logger.error('Admin Review Approval error', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
