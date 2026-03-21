import { NextRequest, NextResponse } from "next/server"
import { createNotification, getNotifications, getUserIdByEmail } from "@/lib/database"
import { verifyFirebaseToken, requireAdmin } from "@/lib/api-auth"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = await request.json()
    const { userId, type, message, userEmail, title } = body

    if (!userId || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, message' },
        { status: 400 }
      )
    }

    let dbUserId: number;
    if (typeof userId === 'number') {
      dbUserId = userId;
    } else {
      const normalizedUserId = await getUserIdByEmail(userEmail || '');
      if (!normalizedUserId) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      dbUserId = normalizedUserId;
    }

    const finalMessage = title ? `**${title}**\n${message}` : message;

    const result = await createNotification({
      userId: dbUserId,
      type,
      message: finalMessage,
      isRead: false,
    })

    return NextResponse.json({ success: true, notification: result })
  } catch (error: any) {
    const { logger } = await import('@/lib/logger');
    logger.error('Notification POST error', error, { endpoint: '/api/notifications' });

    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'notifications-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request);
    const isAdmin = await requireAdmin(request).catch(() => false);

    if (!authUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = authUser?.email || (isAdmin as any)?.email || '';
    const userId = await getUserIdByEmail(userEmail);

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 20;

    const notifications = await getNotifications(userId, limit);

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    const { logger } = await import('@/lib/logger');
    logger.error('Notification GET error', error, { endpoint: '/api/notifications' });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
