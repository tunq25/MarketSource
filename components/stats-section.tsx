"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { TrendingUp, Shield, Clock, Award } from "lucide-react"

const statVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  show: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 160,
      damping: 20,
      delay: index * 0.08,
    },
  }),
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  })
  const gradientY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"])

  const stats = [
    {
      icon: TrendingUp,
      value: "99.9%",
      label: "Uptime",
      description: "Hệ thống HA, auto-heal và multi-region monitoring.",
    },
    {
      icon: Shield,
      value: "100%",
      label: "Bảo mật",
      description: "Quét bảo mật OWASP + kiểm tra thủ công từng release.",
    },
    {
      icon: Clock,
      value: "24/7",
      label: "Support",
      description: "Thời gian phản hồi trung bình 2 phút qua omni-channel.",
    },
    {
      icon: Award,
      value: "4.9/5",
      label: "Chất lượng",
      description: "Hơn 12.000 review thực tế từ cộng đồng dev.",
    },
  ]

  return (
    <section ref={ref} className="relative overflow-hidden py-24">
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-purple-500/20 via-transparent to-transparent blur-[120px]"
        style={{ y: gradientY }}
      />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] as const }}
        >
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            Tại sao chọn{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
              Qtusdev
            </span>
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Bộ chỉ số realtime giúp bạn thấy rõ độ ổn định và độ tin cậy của hệ thống.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-[1px] shadow-2xl shadow-purple-500/10 backdrop-blur-xl dark:bg-gray-900/60"
              variants={statVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              custom={index}
            >
              <div className="rounded-[22px] bg-gradient-to-b from-white/90 via-white/80 to-white/50 p-6 dark:from-gray-900/80 dark:via-gray-900/70 dark:to-gray-900/40">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                  <stat.icon className="h-7 w-7 text-white" />
                </div>
                <div className="mt-6 text-4xl font-semibold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="mt-2 text-sm font-semibold uppercase tracking-[0.3em] text-purple-500">
                  {stat.label}
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{stat.description}</p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Realtime verified</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-600">
                    live
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}