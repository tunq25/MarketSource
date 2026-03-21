"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, MessageCircle, ShoppingCart, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { isStoreMobileNavPath, OPEN_CHAT_WIDGET_EVENT } from "@/lib/mobile-store-nav"
import { getLocalStorage } from "@/lib/localStorage-utils"

const items = [
  { href: "/", label: "Trang chủ", icon: Home, match: (p: string) => p === "/" },
  { href: "/products", label: "Sản phẩm", icon: Package, match: (p: string) => p === "/products" || p.startsWith("/product/") },
  { href: "#chat", label: "Chat", icon: MessageCircle, match: () => false, isChat: true },
  { href: "/cart", label: "Giỏ", icon: ShoppingCart, match: (p: string) => p === "/cart" || p.startsWith("/checkout") },
  {
    href: "/dashboard",
    label: "Tài khoản",
    icon: User,
    match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/auth/login") || p.startsWith("/auth/register"),
  },
] as const

export function MobileBottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const load = () => {
      try {
        const cart = getLocalStorage<{ quantity?: number }[]>("cartItems", [])
        const n = cart.reduce((t, i) => t + (i.quantity ?? 1), 0)
        setCartCount(n)
        const u = getLocalStorage<unknown>("currentUser", null)
        const isIn =
          getLocalStorage<boolean | string>("isLoggedIn", false) === true ||
          getLocalStorage<string>("isLoggedIn", "false") === "true"
        setLoggedIn(!!u && !!isIn)
      } catch {
        setCartCount(0)
        setLoggedIn(false)
      }
    }
    load()
    window.addEventListener("cartUpdated", load)
    window.addEventListener("userUpdated", load)
    return () => {
      window.removeEventListener("cartUpdated", load)
      window.removeEventListener("userUpdated", load)
    }
  }, [])

  if (!mounted || !isStoreMobileNavPath(pathname)) {
    return null
  }

  const profileHref = loggedIn ? "/dashboard" : "/auth/login"

  return (
    <nav
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-[45]",
        "border-t border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-700/80 dark:bg-slate-950/90",
        "pb-[env(safe-area-inset-bottom,0px)]",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
      )}
      role="navigation"
      aria-label="Điều hướng chính"
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {items.map((item) => {
          const Icon = item.icon
          const isChat = "isChat" in item && item.isChat
          const href = item.href === "/dashboard" ? profileHref : item.href
          const active = !isChat && item.match(pathname)

          if (isChat) {
            return (
              <button
                key="chat"
                type="button"
                onClick={() => {
                  window.dispatchEvent(new Event(OPEN_CHAT_WIDGET_EVENT))
                }}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors",
                  "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                )}
                aria-label="Mở chat hỗ trợ"
              >
                <MessageCircle className="h-6 w-6" strokeWidth={2} />
                <span>Chat</span>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "relative flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label === "Tài khoản" && !loggedIn ? "Đăng nhập" : item.label}</span>
              {item.href === "/cart" && cartCount > 0 && (
                <span className="absolute right-[18%] top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-indigo-600 px-1 text-[9px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
