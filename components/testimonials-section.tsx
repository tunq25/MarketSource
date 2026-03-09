"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, Quote } from "lucide-react"

const slideVariants = {
  enter: { opacity: 0, y: 40, scale: 0.9 },
  center: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -40, scale: 0.9 },
}

export function TestimonialsSection() {
  const [current, setCurrent] = useState(0)

  const testimonials = useMemo(() => [
    {
      name: "Nguyễn Văn A",
      role: "Full-stack Engineer @EcomX",
      avatar: "/developer-avatar.png",
      rating: 5,
      content:
        "Qtusdev giúp đội của tôi launch MVP trong 12 ngày thay vì 2 tháng. Mã nguồn clean, kèm luôn playbook triển khai.",
    },
    {
      name: "Trần Thị B",
      role: "Mobile Lead @FinGo",
      avatar: "/female-developer-avatar.png",
      rating: 5,
      content: "Kho React Native/Flutter template tại đây cực kỳ chất lượng. Kết nối API vào chạy luôn, support phản hồi trong 5 phút.",
    },
    {
      name: "Lê Văn C",
      role: "Startup Founder",
      avatar: "/startup-founder-avatar.png",
      rating: 5,
      content: "Tôi build demo cho investor bằng một gói Next.js ở Qtusdev. UI premium, SEO chuẩn, tiết kiệm hàng trăm giờ dev.",
    },
    {
      name: "Phạm Thị D",
      role: "Freelancer",
      avatar: "/freelancer-avatar.png",
      rating: 5,
      content: "Mỗi tuần nhận 3-4 job nhờ template sẵn ở đây. Khách thích vì chất lượng cao mà giao cực nhanh.",
    },
  ], [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const visibleSlides = useMemo(() => {
    const offsets = [-1, 0, 1]
    return offsets.map(offset => {
      const index = (current + offset + testimonials.length) % testimonials.length
      return { ...testimonials[index], isActive: offset === 0, key: `${index}-${offset}` }
    })
  }, [current, testimonials])

  return (
    <section className="relative overflow-hidden py-28">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-purple-500/20 via-transparent to-transparent blur-[140px]" />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-600 shadow-lg shadow-purple-500/10 backdrop-blur-2xl dark:bg-white/10 dark:text-gray-100">
            trusted voices
          </p>
          <h2 className="mt-6 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl dark:text-white">
            Khách hàng <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">nói gì</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Hơn 12.000 developer, founder và freelancer đang dùng Qtusdev cho hành trình build sản phẩm.
          </p>
        </motion.div>

        <div className="mt-16">
          <div className="relative flex flex-col gap-6">
            <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
              {visibleSlides.map((testimonial, idx) => (
                <motion.div
                  key={testimonial.key}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.5 }}
                  className={`rounded-3xl border p-8 backdrop-blur-xl ${
                    testimonial.isActive
                      ? "border-white/20 bg-white/90 shadow-2xl shadow-purple-500/10 dark:border-white/10 dark:bg-gray-950/70"
                      : "border-white/10 bg-white/50 opacity-70 dark:border-white/5 dark:bg-gray-900/40 lg:translate-y-6"
                  }`}
                >
                  <Quote className="mb-6 h-10 w-10 text-purple-400" />
                  <p className="text-lg text-gray-800 dark:text-gray-200">{`“${testimonial.content}”`}</p>
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-purple-200 dark:border-purple-500/40">
                      <AvatarImage src={testimonial.avatar} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                      <Star key={starIndex} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === current ? "w-10 bg-gradient-to-r from-purple-500 to-pink-500" : "w-4 bg-gray-300 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
