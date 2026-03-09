"use client"

import { motion } from "framer-motion"
import { Code, Zap, Shield, Headphones, Gift, CreditCard } from "lucide-react"
import { SpotlightCard } from "@/components/ui/spotlight-card"

const containerVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const, // cubic-bezier equivalent to easeOut
    },
  },
}

const gridVariants = {
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 120,
      damping: 18,
    },
  },
}

export function FeaturesSection() {
  const features = [
    {
      icon: Code,
      title: "Mã nguồn chất lượng",
      description: "Tất cả mã nguồn đều được kiểm duyệt với hơn 60 tiêu chí, sẵn sàng deploy thực chiến.",
      gradient: "from-cyan-400 via-blue-500 to-indigo-500",
      glow: "bg-cyan-400/20",
    },
    {
      icon: Zap,
      title: "Tải về tức thì",
      description: "Hệ thống CDN đa vùng giúp bạn nhận file chỉ trong vài giây sau khi thanh toán.",
      gradient: "from-purple-500 via-pink-500 to-orange-400",
      glow: "bg-pink-400/20",
    },
    {
      icon: Shield,
      title: "Bảo mật nhiều lớp",
      description: "Mỗi giao dịch được ký số và lưu audit trail, chống chỉnh sửa & gian lận.",
      gradient: "from-emerald-500 via-green-500 to-lime-400",
      glow: "bg-emerald-400/20",
    },
    {
      icon: Headphones,
      title: "Hỗ trợ 24/7",
      description: "Live-chat, ticket và hotline được đồng bộ qua AI copilot giúp xử lý trong <5 phút.",
      gradient: "from-amber-500 via-orange-500 to-rose-500",
      glow: "bg-amber-400/20",
    },
    {
      icon: Gift,
      title: "Quà tặng định kỳ",
      description: "Chương trình VIP & voucher cá nhân hóa theo hành vi mua hàng của bạn.",
      gradient: "from-fuchsia-500 via-rose-500 to-red-500",
      glow: "bg-fuchsia-400/20",
    },
    {
      icon: CreditCard,
      title: "Thanh toán đa kênh",
      description: "Tích hợp Banking, Momo, VietQR, Stripe, crypto... với tỷ lệ thành công 99.98%.",
      gradient: "from-indigo-500 via-violet-500 to-purple-500",
      glow: "bg-indigo-400/20",
    },
  ]

  return (
    <section className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-purple-50/30 to-white dark:from-gray-900 dark:via-purple-900/30 dark:to-gray-950" />
      <div className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-purple-500/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-blue-500/20 blur-[160px]" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="mx-auto mb-16 max-w-3xl text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 shadow-lg shadow-purple-500/10 backdrop-blur-xl dark:bg-white/10 dark:text-gray-100">
            Signature Experience
          </p>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            Tính năng <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">nổi bật</span>
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Các mô-đun được thiết kế theo chuẩn sản phẩm doanh nghiệp: trực quan, nhanh và tràn đầy năng lượng sáng tạo.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={gridVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <SpotlightCard glowClassName={feature.glow}>
                <div className="flex flex-col gap-4">
                  <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${feature.gradient}`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    <span className="h-1 w-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400" />
                    Real-time sync
                  </div>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
