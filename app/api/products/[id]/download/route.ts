import { NextRequest, NextResponse } from 'next/server';
import { trackDownload, getProductById } from '@/lib/database-mysql';
import { verifyFirebaseToken, getClientIP } from '@/lib/api-auth';
import { checkRateLimitAndRespond } from '@/lib/rate-limit';
import { getUserIdByEmail } from '@/lib/database-mysql';

export const runtime = 'nodejs'

/**
 * POST /api/products/[id]/download
 * Track download và trả về download URL
 * Chỉ user đã mua sản phẩm mới được tải xuống
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let routeId: string | undefined
  try {
    // Rate limiting
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 60, 'product-download');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Require authentication
    const authUser = await verifyFirebaseToken(request);
    if (!authUser) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const routeParams = await params;
    routeId = routeParams.id;
    const productId = parseInt(routeParams.id);

    if (isNaN(productId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID'
      }, { status: 400 });
    }

    // Check product exists
    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Get user ID
    const userId = await getUserIdByEmail(authUser.email || '');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User not found in database'
      }, { status: 404 });
    }

    // Get IP address và user agent
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Track download (sẽ kiểm tra user đã mua chưa)
    const result = await trackDownload({
      userId,
      productId,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Download tracked successfully',
      downloadUrl: result.downloadUrl,
      downloadedAt: result.downloadedAt,
    });
  } catch (error: unknown) {
    const { createErrorResponse, logError } = await import('@/lib/error-handler');
    logError('Product download', error);

    if (error instanceof Error && error.message?.includes('cần mua sản phẩm')) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 403 });
    }

    return NextResponse.json(
      createErrorResponse(error, 500),
      { status: 500 }
    );
  }
}
