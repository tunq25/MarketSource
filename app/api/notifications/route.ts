import { NextRequest, NextResponse } from "next/server"
import { createNotification } from "@/lib/database-mysql"
import { verifyFirebaseToken, requireAdmin } from "@/lib/api-auth"
import { getUserIdByEmail } from "@/lib/database-mysql"

export const runtime = 'nodejs'

// ✅ FIX: Migrate từ mysql.ts sang PostgreSQL
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication để tạo notification
    await requireAdmin(request);

    const body = await request.json()
    const { userId, type, message, userEmail, title } = body

    if (!userId || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, message' },
        { status: 400 }
      )
    }

    // Normalize userId: convert string uid to PostgreSQL INT
    let dbUserId: number;
    if (typeof userId === 'number') {
      dbUserId = userId;
    } else {
      // Try to get user ID by email
      const normalizedUserId = await getUserIdByEmail(userEmail || '');
      if (!normalizedUserId) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      dbUserId = normalizedUserId;
    }

    // Combine title and message using markdown syntax
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
    // ✅ FIX: Thêm rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'notifications-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { getNotifications, getUserIdByEmail } = await import('@/lib/database-mysql');
    const userId = await getUserIdByEmail(authUser.email || '');

    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isReadParam = searchParams.get('isRead');
    const isRead = isReadParam === 'true' ? true : isReadParam === 'false' ? false : undefined;

    const notifications = await getNotifications(userId, isRead);

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    const { logger } = await import('@/lib/logger');
    logger.error('Notification GET error', error, { endpoint: '/api/notifications' });
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
