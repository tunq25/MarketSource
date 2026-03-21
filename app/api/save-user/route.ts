import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, verifyFirebaseToken, requireEmailVerifiedForUser } from '@/lib/api-auth';
import { createOrUpdateUser } from '@/lib/database';
import { logger } from '@/lib/logger';
import { readJsonBody } from '@/lib/parse-json-body';

export const runtime = 'nodejs'

/**
 * API để lưu/cập nhật user vào PostgreSQL
 * Được gọi từ OAuth callbacks hoặc register/login
 * Alias cho save-user-pg để tương thích với code cũ
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const body = parsed.data as Record<string, unknown>;
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    const name = typeof body.name === 'string' ? body.name : undefined;
    const username = typeof body.username === 'string' ? body.username : undefined;
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : undefined;
    const providedIp = typeof body.ipAddress === 'string' ? body.ipAddress : undefined;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // ✅ FIX SECURITY: Mọi request update profile phải đi kèm verify token (Hoặc NextAuth hoặc Custom JWT)
    let authenticatedEmail = null;

    // 1. Thử check NextAuth session
    try {
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/next-auth');
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        authenticatedEmail = session.user.email;
      }
    } catch { /* Ignore */ }

    // 2. Nếu NextAuth không có, thử check JWT Cookie (auth-token) từ luồng login thủ công
    if (!authenticatedEmail) {
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('auth-token');
        if (tokenCookie) {
          const { verifyToken } = await import('@/lib/jwt');
          const payload = await verifyToken(tokenCookie.value);
          if (payload?.email) {
            authenticatedEmail = payload.email;
          }
        }
      } catch { /* Ignore */ }
    }

    if (
      !authenticatedEmail ||
      authenticatedEmail.trim().toLowerCase() !== email
    ) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized profile update request' },
        { status: 401 }
      );
    }

    const authUser = await verifyFirebaseToken(request);
    if (authUser) {
      const ev = await requireEmailVerifiedForUser(authUser);
      if (ev) return ev;
    }

    // Lấy IP từ request nếu không có trong body
    const ipAddress = providedIp || getClientIP(request);

    // Tạo hoặc cập nhật user (Không bao giờ cho phép update password qua route này)
    const result = await createOrUpdateUser({
      email,
      name: name || username,
      username,
      passwordHash: undefined,
      avatarUrl,
      ipAddress,
      role: 'user', // Default role, có thể thay đổi sau
    });

    return NextResponse.json({
      success: true,
      userId: result.id,
      isNew: result.isNew,
      message: result.isNew ? 'User created successfully' : 'User updated successfully',
    });
  } catch (error: any) {
    logger.error('Save user to PostgreSQL error', error, { endpoint: '/api/save-user' });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save user' },
      { status: 500 }
    );
  }
}
