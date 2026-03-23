"use client"

import { Suspense, type ReactNode } from "react"
import { motion, useReducedMotion } from "framer-motion"

export const runtime = 'nodejs'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.main
      initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full space-y-6 py-6 sm:py-8"
    >
      <Suspense fallback={<div className="h-48 rounded-2xl bg-muted animate-pulse" />}>{children}</Suspense>
    </motion.main>
  )
}

