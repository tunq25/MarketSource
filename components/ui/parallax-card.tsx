"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface ParallaxCardProps {
  className?: string
  intensity?: number
  children: React.ReactNode
}

export function ParallaxCard({ className, intensity = 12, children }: ParallaxCardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const rotateZ = useMotionValue(0)
  const shadow = useTransform(rotateX, [-intensity, intensity], [30, -30])
  const boxShadow = useTransform(rotateX, (value: number) => `0 30px 80px rgba(15, 23, 42, ${Math.abs(value) / 200 + 0.2})`)
  const glowOpacity = useTransform(shadow, (value: number) => Math.max(0.2, Math.min(0.35, Math.abs(value) / 40)))

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const percentX = (x - centerX) / centerX
    const percentY = (y - centerY) / centerY

    rotateX.set(percentY * -intensity)
    rotateY.set(percentX * intensity)
    rotateZ.set(percentX * percentY * intensity * 0.2)
  }

  const handlePointerLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    rotateZ.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn("relative rounded-[32px] border border-white/15 bg-white/5 p-[1px] shadow-2xl backdrop-blur-xl", className)}
      style={{
        rotateX,
        rotateY,
        rotateZ,
        boxShadow,
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="rounded-[28px] border border-white/15 bg-gradient-to-b from-white/50 via-white/20 to-white/0 p-8 dark:from-gray-900/80 dark:via-gray-900/50 dark:to-gray-900/10">
        {children}
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[32px] opacity-0 blur-2xl transition-opacity group-hover/card:opacity-100"
        style={{ background: "#c084fc", opacity: glowOpacity }}
      />
    </motion.div>
  )
}


