import { query, queryOne } from '@/lib/database-mysql';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/**
 * Health check endpoint cho database
 * GET /api/health/database
 * 
 * Dùng cho monitoring và load balancer health checks
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // Test connection với timeout
    const result = await queryOne<any>('SELECT NOW() as timestamp, version() as version');

    const responseTime = Date.now() - startTime;

    // Kiểm tra thêm số lượng bảng (PostgreSQL compatible)
    const tableCount = await queryOne<any>(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
    );

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result?.timestamp,
      version: result?.version ? result.version.split(' ')[0] : 'PostgreSQL',
      tableCount: parseInt(tableCount?.count || '0'),
      responseTime: `${responseTime}ms`,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    logger.error('Database health check failed', error);

    return NextResponse.json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    }, {
      status: 503, // Service Unavailable
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  }
}
