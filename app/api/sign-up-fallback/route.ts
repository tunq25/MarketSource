import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createOrUpdateUser } from '@/lib/database-mysql';
import { getClientIP } from '@/lib/api-auth';
import { logger } from '@/lib/logger';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs'

/**
 * ✅ FIX: Sign-up Fallback - Migrate từ mysql.ts sang database.ts
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, userData, deviceInfo, ipAddress: providedIp } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { user: null, error: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { user: null, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }
    
    if (!userData?.name || userData.name.length < 2) {
      return NextResponse.json(
        { user: null, error: 'Tên phải có ít nhất 2 ký tự' },
        { status: 400 }
      );
    }
    
    // ✅ FIX: Kiểm tra email đã tồn tại trong PostgreSQL
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return NextResponse.json(
        { user: null, error: 'Email này đã được đăng ký!' },
        { status: 400 }
      );
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const ipAddress = providedIp || getClientIP(request);
    
    // Create new user
    const result = await createOrUpdateUser({
      email,
      name: userData.name,
      username: userData.name.toLowerCase().replace(/\s+/g, '_'),
      passwordHash,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
      ipAddress,
      role: 'user',
    });
    
    if (!result || !result.id) {
      return NextResponse.json(
        { user: null, error: 'Không thể tạo tài khoản' },
        { status: 500 }
      );
    }
    
    // ✅ FIX: Lấy user data đầy đủ từ database để trả về balance
    const { getUserById } = await import('@/lib/database');
    const fullUser = await getUserById(result.id);
    
    return NextResponse.json({
      user: {
        id: result.id,
        uid: result.id.toString(),
        email,
        displayName: userData.name,
        name: userData.name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`,
        balance: fullUser?.balance ? parseFloat(String(fullUser.balance)) : 0,
        role: fullUser?.role || 'user',
      },
      error: null,
    });
  } catch (error: any) {
    logger.error('API sign-up fallback error', error, { endpoint: '/api/sign-up-fallback' });
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { user: null, error: 'Email này đã được đăng ký!' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { user: null, error: error.message || 'Failed to sign up' },
      { status: 500 }
    );
  }
}
