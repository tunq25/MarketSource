import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { jwtVerify } from 'jose'

/**
 * Admin: NextAuth (role=admin) HOẶC cookie admin-token từ POST /api/admin-login (JWT jose, cùng secret với lib/jwt).
 */
async function isAdminAuthorized(request: NextRequest): Promise<boolean> {
  try {
    const nextAuth = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })
    if (nextAuth && (nextAuth as { role?: string }).role === 'admin') {
      return true
    }
  } catch {
    /* ignore */
  }

  const raw = request.cookies.get('admin-token')?.value
  if (!raw) return false

  const secretKey = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secretKey) return false

  try {
    const secret = new TextEncoder().encode(secretKey)
    const { payload } = await jwtVerify(raw, secret)
    return payload.role === 'admin'
  } catch {
    return false
  }
}

/**
 * ✅ SECURITY FIX: Middleware with authentication guard
 * - Bảo vệ /admin/* routes (chỉ admin)
 * - Bảo vệ /dashboard/* routes (user đã đăng nhập)
 * - Block Vite-related requests
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ FIX: Ignore Vite-related requests (có thể từ browser extension hoặc cache)
  if (
    pathname.includes('@vite') ||
    pathname.includes('@react-refresh') ||
    pathname.includes('/src/main.tsx') ||
    pathname.includes('vite.svg') ||
    pathname.startsWith('/@')
  ) {
    return new NextResponse(null, { status: 404 })
  }

  // ✅ FIX: Redirect icon-192.png to logoqtusdev.png
  if (pathname === '/icon-192.png') {
    return NextResponse.redirect(new URL('/logoqtusdev.png', request.url))
  }

  // ✅ SECURITY: /admin — NextAuth admin HOẶC JWT cookie admin-token (đăng nhập qua /api/admin-login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const allowed = await isAdminAuthorized(request)
    if (!allowed) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ✅ SECURITY: Bảo vệ /dashboard routes — dùng NextAuth session
  if (pathname.startsWith('/dashboard') || pathname === '/deposit' || pathname === '/withdraw') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ✅ SECURITY: Thêm security headers
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
