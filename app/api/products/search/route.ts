import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/database-enhancements';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic';

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  category: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minRating: z.number().min(0).max(5).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // ✅ FIX: Thêm rate limiting để tránh abuse
    const { checkRateLimitAndRespond } = await import('@/lib/rate-limit');
    const rateLimitResponse = await checkRateLimitAndRespond(request, 20, 10, 'product-search');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || searchParams.get('query') || '';
    if (!query) {
      return NextResponse.json({ success: false, error: 'Search query required' }, { status: 400 });
    }
    
    // ✅ FIX: Validate query length để tránh DoS
    if (query.length > 200) {
      return NextResponse.json({ success: false, error: 'Search query too long (max 200 characters)' }, { status: 400 });
    }

    const filters: any = {
      category: searchParams.get('category') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) delete filters[key];
    });

    const validation = searchSchema.safeParse({ query, ...filters });
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: validation.error.errors[0]?.message || 'Invalid search parameters'
      }, { status: 400 });
    }

    const products = await searchProducts(query, validation.data);
    
    return NextResponse.json({
      success: true,
      products,
      count: products.length,
      filters: validation.data,
    });
  } catch (error: any) {
    logger.error('Product search error', error, { url: request.url });
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
