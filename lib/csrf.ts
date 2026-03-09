/**
 * CSRF Protection Middleware
 * ✅ SECURITY FIX: CSRF protection cho admin routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || 'change-this-in-production';

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  return token;
}

/**
 * Hash CSRF token để lưu trong cookie
 */
export function hashCSRFToken(token: string): string {
  return createHash('sha256').update(token + CSRF_SECRET).digest('hex');
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string, hashedToken: string): boolean {
  const expectedHash = hashCSRFToken(token);
  return expectedHash === hashedToken;
}

/**
 * CSRF Protection Middleware
 * Kiểm tra CSRF token từ header và cookie
 */
export function csrfProtection(request: NextRequest): { valid: boolean; error?: string } {
  // Skip CSRF check cho GET requests (read-only)
  if (request.method === 'GET' || request.method === 'HEAD') {
    return { valid: true };
  }

  const csrfToken = request.headers.get('X-CSRF-Token');
  const csrfCookie = request.cookies.get('csrf-token')?.value;

  if (!csrfToken || !csrfCookie) {
    return { valid: false, error: 'CSRF token missing' };
  }

  if (!verifyCSRFToken(csrfToken, csrfCookie)) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  return { valid: true };
}

/**
 * Set CSRF token cookie trong response
 */
export function setCSRFTokenCookie(response: NextResponse, token: string): NextResponse {
  const hashedToken = hashCSRFToken(token);
  
  response.cookies.set('csrf-token', hashedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return response;
}

