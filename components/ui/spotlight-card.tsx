"use client"

import { motion, useMotionValue } from "framer-motion"
import { useCallback, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface SpotlightCardProps {
  children: React.ReactNode
  className?: string
  glowClassName?: string
  hoverScale?: number
}

/**
 * SpotlightCard
 * ------------------------------
 * - 3D tilt theo chuột (rotateX/rotateY)
 * - Spotlight gradient chạy theo vị trí pointer
 * - Hỗ trợ hiệu ứng glow lớp ngoài để kết hợp với glassmorphism
 */
export function SpotlightCard({
  children,
  className,
  glowClassName,
  hoverScale = 1.015,
}: SpotlightCardProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 })

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const scale = useMotionValue(1)

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect()
      const relativeX = event.clientX - rect.left
      const relativeY = event.clientY - rect.top
      const percentX = (relativeX / rect.width) * 100
      const percentY = (relativeY / rect.height) * 100

      setSpotlight({ x: percentX, y: percentY })

      const tiltX = ((relativeY - rect.height / 2) / rect.height) * -12
      const tiltY = ((relativeX - rect.width / 2) / rect.width) * 12
      rotateX.set(tiltX)
      rotateY.set(tiltY)
      scale.set(hoverScale)
    },
    [rotateX, rotateY, scale, hoverScale],
  )

  const handlePointerLeave = useCallback(() => {
    rotateX.set(0)
    rotateY.set(0)
    scale.set(1)
    setIsHovering(false)
  }, [rotateX, rotateY, scale])

  const spotlightStyle = useMemo(
    () => ({
      background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.35), transparent 45%)`,
      opacity: isHovering ? 1 : 0,
    }),
    [spotlight, isHovering],
  )

  return (
    <motion.div
      className={cn("group relative h-full rounded-2xl border border-white/10 bg-white/5 dark:bg-white/5", className)}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
      }}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setIsHovering(true)}
      onPointerLeave={handlePointerLeave}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl blur-xl opacity-0 transition-opacity duration-300",
          isHovering ? "opacity-100" : "opacity-0",
          glowClassName,
        )}
      />
      <div className="pointer-events-none absolute inset-[1px] rounded-[22px]" style={spotlightStyle} />
      <div className="relative z-10 h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/50 to-white/0 p-[1px] dark:from-white/10 dark:to-white/0">
        <div className="h-full rounded-[22px] bg-white/80 p-6 backdrop-blur-xl dark:bg-gray-900/70">{children}</div>
      </div>
    </motion.div>
  )
}


