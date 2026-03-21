"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Logo } from "@/components/logo"
import { Facebook, Mail, MessageCircle, Github, Phone } from "lucide-react"

export function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.settings) {
            setSettings(data.settings)
          }
        }
      } catch (error) {
        console.error("Error fetching settings:", error)
      }
    }
    fetchSettings()
  }, [])

  return (
    <footer className="border-t border-slate-200/90 bg-slate-50/95 dark:border-slate-700/80 dark:bg-slate-950/95">
      {/* Khoảng đệm phía dưới: tránh nội dung bị che bởi bottom nav (mobile) + safe area */}
      <div className="container mx-auto max-w-6xl px-4 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] pt-10 md:px-6 md:pb-14 lg:px-8 lg:pb-16">
        {/* Cột 1: thương hiệu — full width mobile */}
        <div className="mb-10 flex flex-col items-center text-center md:mb-12 md:items-start md:text-left">
          <div className="mb-4 flex justify-center md:justify-start">
            <Logo />
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Qtusdev — marketplace mã nguồn cho developer. Sản phẩm được tuyển chọn, giá minh bạch, hỗ trợ tận tâm.
          </p>
          <div className="mt-5 flex justify-center gap-3 md:justify-start">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-500/50"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={"mailto:" + (settings.contactEmail || "qtussnguyen0220@gmail.com")}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href="https://files.catbox.moe/kb9350.jpg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
              aria-label="Zalo / chat"
            >
              <MessageCircle className="h-5 w-5" />
            </a>
            <a
              href="#"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white"
              aria-label="Github"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Hai cột link — chuẩn mobile 2 cột */}
        <div className="mb-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-10 md:mb-12 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Liên kết nhanh
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Mã nguồn
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Thể loại
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Hỗ trợ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Hỗ trợ &amp; pháp lý
            </h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/support"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Trung tâm hỗ trợ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Điều khoản
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="/deposit"
                  className="text-sm text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  Nạp tiền
                </Link>
              </li>
            </ul>
          </div>

          {/* Liên hệ — full width row 2 trên mobile, cột 3 desktop */}
          <div className="col-span-2 border-t border-slate-200 pt-8 dark:border-slate-800 md:col-span-1 md:border-t-0 md:pt-0 lg:border-0">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
              Liên hệ
            </h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" aria-hidden />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Hotline</p>
                  <a
                    href={"tel:" + (settings.contactPhone?.replace(/[^0-9+]/g, "") || "0999888777")}
                    className="text-sm font-medium text-slate-900 break-all hover:text-emerald-600 dark:text-slate-100"
                  >
                    {settings.contactPhone || "0999.888.777"}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" aria-hidden />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Email</p>
                  <a
                    href={"mailto:" + (settings.contactEmail || "qtussnguyen0220@gmail.com")}
                    className="text-sm font-medium text-slate-900 break-all hover:text-indigo-600 dark:text-slate-100"
                  >
                    {settings.contactEmail || "qtussnguyen0220@gmail.com"}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Facebook className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" aria-hidden />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Facebook</p>
                  <a
                    href="https://www.facebook.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-900 hover:text-blue-600 dark:text-slate-100"
                  >
                    Qtusdev Official
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bộ Công Thương */}
        <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-col items-center">
            <Image
              src="/bocongthuong.png"
              alt="Đã thông báo Bộ Công Thương"
              width={200}
              height={80}
              className="h-auto max-w-[min(100%,240px)] object-contain opacity-90"
              priority={false}
            />
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <p className="text-center text-xs text-slate-500 dark:text-slate-500 md:text-left">
              © {new Date().getFullYear()} Qtusdev. Giữ mọi quyền.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
              <Link href="/terms" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                Điều khoản
              </Link>
              <Link href="/privacy" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                Bảo mật
              </Link>
              <Link href="/cookies" className="text-slate-600 hover:text-indigo-600 dark:text-slate-400">
                Cookie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
