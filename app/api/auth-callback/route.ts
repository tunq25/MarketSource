import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api-auth';
import { createOrUpdateUser } from '@/lib/database';
import { logger } from '@/lib/logger';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { readJsonBody } from '@/lib/parse-json-body';

export const runtime = 'nodejs'

/**
 * OAuth Callback Handler
 * Xử lý callback từ OAuth providers (Google, GitHub, Facebook)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || 'google';
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/auth/login?error=missing_code', request.url)
      );
    }

    // ✅ IMPLEMENTED: OAuth flow được handle bởi NextAuth.js
    // NextAuth.js tự động xử lý code exchange và token management
    // Nếu cần custom OAuth flow, có thể implement ở đây

    return NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
  } catch (error: any) {
    logger.error('OAuth callback error', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // ✅ SECURITY FIX: Require valid NextAuth session to prevent Account Takeover
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: No active session' },
        { status: 401 }
      );
    }

    const parsed = await readJsonBody(request);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }
    const body = parsed.data;
    const {
      email,
      name,
      username,
      provider,
      uid,
      ipAddress: providedIp,
    } = body as {
      email?: string;
      name?: string;
      username?: string;
      provider?: string;
      uid?: string;
      ipAddress?: string;
    };
    const avatarUrl =
      (typeof body.avatarUrl === 'string' && body.avatarUrl) ||
      (typeof body.image === 'string' && body.image) ||
      undefined;

    if (!email || !uid) {
      return NextResponse.json(
        { success: false, error: 'Email and UID are required' },
        { status: 400 }
      );
    }

    // ✅ SECURITY FIX: Verify the requested email matches the authenticated session email
    if (session.user.email?.toLowerCase() !== email.toLowerCase()) {
      logger.warn('Auth callback email mismatch spoofing attempt', { 
        sessionEmail: session.user.email, 
        requestEmail: email 
      });
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Email mismatch' },
        { status: 403 }
      );
    }

    // Lấy IP từ request nếu không có trong body
    const ipAddress = providedIp || getClientIP(request);

    // Tạo hoặc cập nhật user từ OAuth
    const result = await createOrUpdateUser({
      email,
      name: name || username,
      username,
      avatarUrl,
      ipAddress,
      role: 'user',
      markEmailVerified: true,
    });

    if (!result || !result.id) {
      return NextResponse.json(
        { success: false, error: 'Không thể tạo/cập nhật tài khoản' },
        { status: 500 }
      );
    }

    // ✅ FIX: Lấy user data đầy đủ từ database để trả về balance (Using consistent library)
    const { getUserById } = await import('@/lib/database');
    const fullUser = await getUserById(result.id);
    
    return NextResponse.json({
      success: true,
      userId: result.id,
      user: {
        id: result.id,
        uid: result.id.toString(),
        email,
        name: name || username,
        displayName: name || username,
        avatar: avatarUrl,
        balance: fullUser?.balance ? parseFloat(String(fullUser.balance)) : 0,
        role: fullUser?.role || 'user',
      },
      isNew: result.isNew,
      message: result.isNew ? 'User created successfully' : 'User updated successfully',
    });
  } catch (error: any) {
    logger.error('OAuth callback POST error', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process OAuth callback' },
      { status: 500 }
    );
  }
}
