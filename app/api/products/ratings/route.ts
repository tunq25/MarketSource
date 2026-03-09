import { NextRequest, NextResponse } from "next/server"
import {
  getProductRating,
  getProductRatings,
  getTopRatedProducts,
  getRatingStatistics,
} from "@/lib/product-ratings"
import { verifyFirebaseToken, requireAdmin } from "@/lib/api-auth"
import { logger } from "@/lib/logger"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/products/ratings
 * Get rating cho một hoặc nhiều products
 */
export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'product-ratings');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productIds = searchParams.get('productIds');
    const top = searchParams.get('top');
    const stats = searchParams.get('stats');
    
    // ✅ FIX: Validate và limit số lượng productIds
    if (productIds) {
      const ids = productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 100) {
        return NextResponse.json({
          success: false,
          error: 'Too many product IDs (max 100)'
        }, { status: 400 });
      }
    }

    // Get top rated products
    if (top) {
      const limit = parseInt(top) || 10;
      const products = await getTopRatedProducts(limit);
      return NextResponse.json({
        success: true,
        products,
      });
    }

    // Get statistics (admin only)
    if (stats === 'true') {
      try {
        await requireAdmin(request);
        const statistics = await getRatingStatistics();
        return NextResponse.json({
          success: true,
          statistics,
        });
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return NextResponse.json({
            success: false,
            error: 'Admin access required'
          }, { status: 401 });
        }
        throw error;
      }
    }

    // Get rating cho nhiều products
    if (productIds) {
      const ids = productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const ratings = await getProductRatings(ids);
        return NextResponse.json({
          success: true,
          ratings,
        });
      }
    }

    // Get rating cho một product
    if (productId) {
      const productIdNum = parseInt(productId);
      if (isNaN(productIdNum)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid product ID'
        }, { status: 400 });
      }

      const rating = await getProductRating(productIdNum);
      return NextResponse.json({
        success: true,
        rating,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Missing productId, productIds, top, or stats parameter'
    }, { status: 400 });

  } catch (error: any) {
    logger.error('Product ratings API error', error, { url: request.url });
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
