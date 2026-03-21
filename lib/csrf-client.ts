/**
 * CSRF cho fetch từ trình duyệt (khớp middleware /api + cookie httpOnly)
 */

let cachedToken: string | null = null
let inflight: Promise<string> | null = null

export function clearCsrfClientCache(): void {
  cachedToken = null
  inflight = null
}

export async function getCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken
  if (inflight) return inflight
  inflight = (async () => {
    const res = await fetch('/api/csrf', { credentials: 'include' })
    if (!res.ok) throw new Error('Không lấy được CSRF token')
    const data = (await res.json()) as { csrfToken?: string }
    const t = data.csrfToken
    if (!t || typeof t !== 'string') throw new Error('Phản hồi CSRF không hợp lệ')
    cachedToken = t
    return t
  })()
  try {
    return await inflight
  } finally {
    inflight = null
  }
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const csrfToken = await getCsrfToken()
  return { 'X-CSRF-Token': csrfToken }
}
