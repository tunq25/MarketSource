import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createOrUpdateUser } from '@/lib/database-mysql';
import { getClientIP } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

/**
 * ✅ FIX: OAuth Social Login Fallback - Migrate từ localStorage sang PostgreSQL
 */
export async function POST(request: NextRequest) {
  let providerType: string | undefined;
  try {
    const body = await request.json();
    providerType = body.providerType;
    const { deviceInfo, ipAddress: providedIp, email, name, avatarUrl, uid } = body;
    
    if (!email || !uid) {
      return NextResponse.json(
        { user: null, error: 'Email and UID are required' },
        { status: 400 }
      );
    }
    
    // ✅ FIX: Không dùng localStorage ở server-side
    const existingUser = await getUserByEmail(email);
    const ipAddress = providedIp || getClientIP(request);

    if (existingUser) {
      // Update existing user với thông tin mới nhất từ OAuth
      await createOrUpdateUser({
        email,
        name: name || existingUser.name,
        avatarUrl: avatarUrl || existingUser.avatar_url,
        ipAddress,
      });
      
      if (!existingUser.id) {
        return NextResponse.json(
          { user: null, error: 'User ID not found' },
          { status: 500 }
        );
      }
      
      // ✅ FIX: Trả về balance và role từ database
      return NextResponse.json({
        user: {
          id: existingUser.id,
          uid: uid || existingUser.id.toString(),
          email: existingUser.email || email,
          displayName: existingUser.name || name || email,
          name: existingUser.name,
          avatar: existingUser.avatar_url || avatarUrl,
          balance: existingUser.balance ? parseFloat(String(existingUser.balance)) : 0,
          role: existingUser.role || 'user',
        },
        error: null,
      });
    } else {
      // Create new user từ OAuth
      const result = await createOrUpdateUser({
        email,
        name: name || `User-${providerType || 'OAuth'}`,
        username: name || `user_${providerType || 'oauth'}_${Date.now()}`,
        avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || providerType || 'User')}&background=random`,
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
          uid: uid || result.id.toString(),
          email,
          displayName: name || `User-${providerType || 'OAuth'}`,
          name: name || `User-${providerType || 'OAuth'}`,
          avatar: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || providerType || 'User')}&background=random`,
          balance: fullUser?.balance ? parseFloat(String(fullUser.balance)) : 0,
          role: fullUser?.role || 'user',
        },
        error: null,
      });
    }
  } catch (error: any) {
    logger.error(`API ${providerType || 'social'} auth fallback error`, error, { providerType });
    return NextResponse.json(
      { user: null, error: `Không thể đăng nhập bằng ${providerType || 'OAuth'}!` },
      { status: 500 }
    );
  }
}
