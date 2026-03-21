import type { NextRequest } from "next/server"

/**
 * Đọc JSON từ body an toàn (tránh lỗi khi body rỗng / không phải JSON).
 */
export async function readJsonBody<T extends Record<string, unknown> = Record<string, unknown>>(
  request: NextRequest
): Promise<{ ok: true; data: T } | { ok: false; status: number; error: string }> {
  const raw = await request.text()
  if (!raw?.trim()) {
    return { ok: false, status: 400, error: "Request body is required" }
  }
  try {
    const data = JSON.parse(raw) as T
    if (typeof data !== "object" || data === null || Array.isArray(data)) {
      return { ok: false, status: 400, error: "Invalid JSON body" }
    }
    return { ok: true, data }
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" }
  }
}
