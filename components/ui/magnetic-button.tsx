"use client"

import { motion, useMotionValue, type HTMLMotionProps } from "framer-motion"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface MagneticButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  glowClassName?: string
  children?: React.ReactNode
}

export function MagneticButton({ className, glowClassName, children, type = "button", ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | null>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const offsetX = event.clientX - rect.left - rect.width / 2
    const offsetY = event.clientY - rect.top - rect.height / 2
    x.set(offsetX * 0.2)
    y.set(offsetY * 0.2)
  }

  const handlePointerLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      style={{ x, y }}
      className={cn(
        "group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300",
        className,
      )}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          glowClassName,
        )}
      >
        <span className="absolute inset-0 bg-white/30 blur-2xl" />
      </span>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.button>
  )
}


