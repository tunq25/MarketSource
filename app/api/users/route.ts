import { NextRequest, NextResponse } from "next/server"
import { query, getUserByIdMySQL, getUserByEmailMySQL, createOrUpdateUserMySQL, getUserIdByEmailMySQL } from "@/lib/database-mysql"
import { verifyFirebaseToken, requireAdmin } from "@/lib/api-auth"
import { logger } from "@/lib/logger"

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic';

/**
 * ✅ FIX: Migrate từ mysql.ts sang database.ts (PostgreSQL)
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'users-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const email = searchParams.get('email')
    const uid = searchParams.get('uid')
    
    // Verify authentication
    const authUser = await verifyFirebaseToken(request)
    const isAdmin = await requireAdmin(request).catch(() => false)
    
    if (!authUser && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get user by ID
    if (userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ data: null, error: 'Invalid user ID' }, { status: 400 });
      }
      
      const user = await getUserByIdMySQL(userIdNum);
      if (!user) {
        return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 });
      }
      
      // User chỉ xem được data của mình, admin xem được tất cả
      if (!isAdmin) {
        const currentUserId = await getUserIdByEmailMySQL(authUser?.email || '')
        if (currentUserId !== user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }
      }
      
      return NextResponse.json({ data: user, error: null })
    }
    
    // Get user by email
    if (email) {
      const user = await getUserByEmailMySQL(email)
      if (!user) {
        return NextResponse.json({ data: null, error: 'User not found' }, { status: 404 })
      }
      
      // User chỉ xem được data của mình
      if (!isAdmin && authUser?.email !== email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
      
      return NextResponse.json({ data: user, error: null })
    }
    
    // Get all users (chỉ admin)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // ✅ FIX: Get all users với proper format
    const result = await query<any>(
      'SELECT id, email, name, username, avatar_url, balance, role, created_at, updated_at, ip_address FROM users ORDER BY created_at DESC'
    )
    
    // ✅ FIX: Trả về cả 'users' và 'data' để tương thích với cả hai format
    return NextResponse.json({ 
      users: result, 
      data: result, 
      error: null 
    })
  } catch (error: any) {
    logger.error('Users GET error', error, { url: request.url })
    return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 60, 'users-put');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request)
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const { userId, userData } = body
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    // Verify user chỉ update được data của mình
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }
    
    const currentUserId = await getUserIdByEmailMySQL(authUser.email || '')
    const isAdmin = await requireAdmin(request).catch(() => false)
    
    if (!isAdmin && currentUserId !== userIdNum) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // ✅ FIX: Lấy email từ user hiện tại nếu không có trong userData
    const currentUser = await getUserByIdMySQL(userIdNum);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // ✅ FIX: Chỉ admin mới được update role, user không thể tự nâng quyền
    const updateData: any = {
      email: userData.email || currentUser.email, // ✅ FIX: Đảm bảo có email
      name: userData.name,
      username: userData.username,
      avatarUrl: userData.avatar_url,
    };
    
    // Chỉ admin mới được update role
    if (isAdmin && userData.role) {
      updateData.role = userData.role;
    }
    
    await createOrUpdateUserMySQL(updateData)
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Users PUT error', error, { endpoint: 'users-put' })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
