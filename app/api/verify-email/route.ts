import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/database'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

/**
 * GET /api/verify-email?token=... — link từ email (không cần CSRF)
 */
export async function GET(request: NextRequest) {
  const base = new URL(request.url).origin
  const token = request.nextUrl.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=verify_missing', base))
  }

  try {
    const r = await pool.query(
      `SELECT id FROM users
       WHERE email_verification_token = $1
         AND (email_verification_expires IS NULL OR email_verification_expires > NOW())
         AND deleted_at IS NULL`,
      [token]
    )
    if (r.rows.length === 0) {
      return NextResponse.redirect(new URL('/auth/login?error=verify_invalid', base))
    }
    const id = r.rows[0].id as number
    await pool.query(
      `UPDATE users SET
         email_verified_at = COALESCE(email_verified_at, NOW()),
         email_verification_token = NULL,
         email_verification_expires = NULL,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    )
    return NextResponse.redirect(new URL('/auth/login?verified=1', base))
  } catch (e) {
    logger.error('verify-email error', e)
    return NextResponse.redirect(new URL('/auth/login?error=verify_failed', base))
  }
}
