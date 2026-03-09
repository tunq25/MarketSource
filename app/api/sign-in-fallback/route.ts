import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createOrUpdateUser } from '@/lib/database-mysql';
import { getClientIP } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs'

/**
 * ✅ FIX: Sign-in Fallback - Migrate từ mysql.ts sang database.ts
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, deviceInfo, ipAddress: providedIp } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { user: null, error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }
    
    // ✅ FIX: Tìm user trong PostgreSQL thay vì mysql.ts
    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json(
        { user: null, error: 'Email hoặc mật khẩu không chính xác!' },
        { status: 401 }
      );
    }
    
    // Verify password
    if (!user.password_hash) {
      return NextResponse.json(
        { user: null, error: 'Tài khoản chưa được thiết lập mật khẩu' },
        { status: 401 }
      );
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { user: null, error: 'Email hoặc mật khẩu không chính xác!' },
        { status: 401 }
      );
    }
    
    // Update IP address và last activity
    const ipAddress = providedIp || getClientIP(request);
    await createOrUpdateUser({
      email,
      ipAddress,
    });
    
    if (!user.id) {
      return NextResponse.json(
        { user: null, error: 'User ID not found' },
        { status: 500 }
      );
    }
    
    // ✅ FIX: Trả về balance và role từ database
    return NextResponse.json({
      user: {
        uid: user.id.toString(),
        id: user.id,
        email: user.email || email,
        displayName: user.name || email,
        name: user.name,
        avatar: user.avatar_url,
        balance: user.balance ? parseFloat(String(user.balance)) : 0,
        role: user.role || 'user',
      },
      error: null,
    });
  } catch (error: any) {
    logger.error('API sign-in fallback error', error, { endpoint: '/api/sign-in-fallback' });
    return NextResponse.json(
      { user: null, error: error.message || 'Failed to sign in' },
      { status: 500 }
    );
  }
}
