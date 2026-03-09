"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, type Variants } from "framer-motion"
import Link from "next/link"
import dynamic from "next/dynamic"
import { ArrowRight, ShieldCheck, Users, Clock3, Sparkles } from "lucide-react"
import { MagneticButton } from "@/components/ui/magnetic-button"
import { Button } from "@/components/ui/button"

const ThreeDFallback = dynamic(
  () => import("@/components/3d-fallback").then(mod => ({ default: mod.ThreeDFallback })),
  { ssr: false },
)

const ThreeJSBackground = dynamic(
  () => import("@/components/three-js-background").then(mod => ({ default: mod.ThreeJSBackground })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-gradient-to-b from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900" />,
  },
)

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  },
}

const statsVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.2 + index * 0.1, duration: 0.6, ease: "easeOut" },
  }),
}

export function HeroSection() {
  const [currentText, setCurrentText] = useState(0)
  const [settings, setSettings] = useState<Record<string, string>>({})
  const texts = ["Mã nguồn chất lượng cao", "Giá cả phải chăng", "Hỗ trợ 24/7", "Cập nhật liên tục"]

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.settings) {
            setSettings(data.settings)
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText(prev => (prev + 1) % texts.length)
    }, 3200)
    return () => clearInterval(interval)
  }, [texts.length])

  const stats = useMemo(
    () => [
      { label: "Doanh nghiệp sử dụng", value: "4.2K+", icon: Users },
      { label: "Triển khai thành công", value: "12K+", icon: ShieldCheck },
      { label: "Tốc độ launch trung bình", value: "12 ngày", icon: Clock3 },
    ],
    [],
  )

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0">
        <ThreeJSBackground />
        <ThreeDFallback />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-950/30 via-gray-950/60 to-gray-950" />
      <div className="pointer-events-none absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-purple-500/30 blur-[160px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[10%] h-96 w-96 rounded-full bg-pink-500/20 blur-[180px]" />

      <div className="relative z-10 w-full max-w-6xl px-6 py-20">
        <motion.div
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
          variants={headingVariants}
          initial="hidden"
          animate="show"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 backdrop-blur-2xl">
            <Sparkles className="h-4 w-4 text-purple-300" />
            Elite Dev Marketplace
          </div>

          <h1 className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {settings.siteName || "Qtusdev"} -{" "}
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-orange-200 bg-clip-text text-transparent">
              {settings.heroTitle || "Market Source"}
            </span>
          </h1>

          <div className="relative mt-6 h-12 w-full sm:h-14">
            <motion.p
              key={currentText}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-base text-white/80 sm:text-lg"
            >
              {texts[currentText]}
            </motion.p>
          </div>

          <p className="mt-4 text-base text-white/70 sm:text-lg">
            {settings.heroSubtitle || "Kho mã nguồn được curate bởi đội ngũ kiến trúc sư phần mềm. Tối ưu UI/UX, bảo mật nhiều lớp và tài liệu triển khai từng bước."}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link href="/products">
              <MagneticButton>
                {settings.heroButtonText || "Khám phá ngay"} <ArrowRight className="h-4 w-4" />
              </MagneticButton>
            </Link>
            <Button
              variant="outline"
              asChild
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/auth/register">Đăng ký miễn phí</Link>
            </Button>
          </div>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              custom={index}
              variants={statsVariants}
              initial="hidden"
              animate="show"
              className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <stat.icon className="mb-4 h-6 w-6 text-purple-200" />
              <div className="text-3xl font-semibold">{stat.value}</div>
              <p className="mt-2 text-sm text-white/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
