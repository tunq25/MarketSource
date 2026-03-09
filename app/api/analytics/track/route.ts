import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/api-auth';
import { getUserIdByEmail } from '@/lib/database-mysql';
import { trackEvent, trackProductView } from '@/lib/database-enhancements';
import { getClientIP } from '@/lib/api-auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

const trackSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await verifyFirebaseToken(request);
    const userId = authUser ? await getUserIdByEmail(authUser.email || '') : undefined;
    
    const body = await request.json();
    const validation = trackSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid data'
      }, { status: 400 });
    }

    const { eventType, eventData } = validation.data;
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Special handling for product_view event
    if (eventType === 'product_view' && eventData?.productId) {
      await trackProductView(eventData.productId, userId || undefined, ipAddress);
    }

    // Track general event
    await trackEvent(eventType, eventData || {}, userId || undefined, ipAddress, userAgent);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Analytics track error', error);
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false, error: 'Analytics tracking failed' }, { status: 500 });
  }
}
