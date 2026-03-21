/**
 * Các route cửa hàng công khai: hiển thị bottom navigation trên mobile.
 * Không áp dụng cho admin, dashboard, auth.
 */
export const OPEN_CHAT_WIDGET_EVENT = "qtusdev:open-chat-widget"

export function isStoreMobileNavPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (pathname.startsWith("/admin")) return false
  if (pathname.startsWith("/dashboard")) return false
  if (pathname.startsWith("/auth")) return false

  const patterns = [
    /^\/$/,
    /^\/products$/,
    /^\/categories$/,
    /^\/support$/,
    /^\/cart$/,
    /^\/checkout$/,
    /^\/deposit$/,
    /^\/withdraw$/,
    /^\/product-info$/,
    /^\/terms$/,
    /^\/privacy$/,
    /^\/product\/[^/]+$/,
  ]
  return patterns.some((re) => re.test(pathname))
}
