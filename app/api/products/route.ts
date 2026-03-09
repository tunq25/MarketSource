import { NextRequest, NextResponse } from 'next/server'
import { getProducts, getProductById, query } from '@/lib/database'
import { requireAdmin, validateRequest } from '@/lib/api-auth'
import { checkRateLimitAndRespond } from '@/lib/rate-limit'
import { productSchema } from '@/lib/validation-schemas'
import { logError, createErrorResponse } from '@/lib/error-handler'

export const runtime = 'nodejs'

/**
 * GET /api/products
 * Lấy danh sách products từ PostgreSQL
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting - logic trong rate-limit sẽ tự động fallback nếu Redis tạch
    const rateLimitResponse = await checkRateLimitAndRespond(request, 30, 10, 'products-get');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const filters: {
      category?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    } = {};

    if (category) {
      filters.category = category;
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true';
    }

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        filters.limit = Math.min(limitNum, 100);
      }
    }

    if (offset) {
      const offsetNum = parseInt(offset);
      if (!isNaN(offsetNum) && offsetNum >= 0) {
        filters.offset = offsetNum;
      }
    }

    const products = await getProducts(filters)

    return NextResponse.json({
      success: true,
      products: products || [],
      count: products?.length || 0,
    });
  } catch (error: any) {
    logError('Products GET', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products from database',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      products: [],
      count: 0
    }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Tạo product mới (admin only) - PostgreSQL
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkRateLimitAndRespond(request, 10, 60, 'products-post');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    await requireAdmin(request);
    const body = await request.json()
    const validation = validateRequest(body, productSchema);

    if (!validation.valid || !validation.data) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Dữ liệu không hợp lệ'
      }, { status: 400 });
    }

    const productData = validation.data

    // Create product trên PostgreSQL
    const sql = `
      INSERT INTO products (
        title, description, price, category, demo_url, download_url, image_url, tags, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING id
    `;

    const res = await query(sql, [
      productData.title,
      productData.description || null,
      productData.price,
      productData.category || null,
      productData.demoUrl || null,
      productData.downloadUrl || null,
      productData.imageUrl || null,
      productData.tags ? JSON.stringify(productData.tags) : null,
      productData.isActive !== false,
    ]);

    const newId = res[0]?.id;
    const product = await getProductById(newId);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error: any) {
    logError('Products POST', error);
    return NextResponse.json(
      createErrorResponse(error, 500),
      { status: 500 }
    );
  }
}

