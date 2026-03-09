import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware for request handling
 * Note: Next.js 16+ deprecated "middleware" convention in favor of "proxy"
 * This is a low-priority warning and doesn't affect functionality
 * Can be migrated to proxy convention in future if needed
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ✅ FIX: Ignore Vite-related requests (có thể từ browser extension hoặc cache)
  if (
    pathname.includes('@vite') ||
    pathname.includes('@react-refresh') ||
    pathname.includes('/src/main.tsx') ||
    pathname.includes('vite.svg') ||
    pathname.startsWith('/@')
  ) {
    // Return 404 ngay lập tức, không compile
    return new NextResponse(null, { status: 404 })
  }

  // ✅ FIX: Redirect icon-192.png to logoqtusdev.png
  if (pathname === '/icon-192.png') {
    return NextResponse.redirect(new URL('/logoqtusdev.png', request.url))
  }

  return NextResponse.next()
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

