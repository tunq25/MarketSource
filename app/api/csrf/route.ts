import { NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFTokenCookie } from '@/lib/csrf'

export const runtime = 'nodejs'

/** Cấp CSRF token + cookie (double-submit). Gọi trước các request POST/PUT/PATCH/DELETE. */
export async function GET() {
  const token = generateCSRFToken()
  const response = NextResponse.json({ csrfToken: token })
  return setCSRFTokenCookie(response, token)
}
