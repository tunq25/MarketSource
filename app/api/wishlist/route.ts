import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/api-auth';
import { getUserIdByEmail } from '@/lib/database-mysql';
import { addToWishlist, removeFromWishlist, getWishlist, isInWishlist } from '@/lib/database-enhancements';
import { checkRateLimitAndRespond } from '@/lib/rate-limit';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

const wishlistSchema = z.object({
  productId: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 10, 'wishlist-post');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserIdByEmail(authUser.email || '');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = wishlistSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid data'
      }, { status: 400 });
    }

    const { productId } = validation.data;
    const result = await addToWishlist(userId, productId);

    if (!result) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product already in wishlist' 
      }, { status: 409 });
    }

    return NextResponse.json({ success: true, wishlistItem: result });
  } catch (error: any) {
    logger.error('Wishlist POST error', error, { endpoint: 'wishlist-post' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 10, 'wishlist-delete');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserIdByEmail(authUser.email || '');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const productId = parseInt(searchParams.get('productId') || '0');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    await removeFromWishlist(userId, productId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Wishlist DELETE error', error, { endpoint: 'wishlist-delete' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 20, 10, 'wishlist-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = await getUserIdByEmail(authUser.email || '');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Check if product is in wishlist
      const inWishlist = await isInWishlist(userId, parseInt(productId));
      return NextResponse.json({ success: true, inWishlist });
    }

    // Get full wishlist
    const wishlist = await getWishlist(userId);
    return NextResponse.json({ success: true, wishlist });
  } catch (error: any) {
    logger.error('Wishlist GET error', error, { endpoint: 'wishlist-get' });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
