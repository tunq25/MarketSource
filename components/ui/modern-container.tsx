"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModernContainerProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export function ModernContainer({ 
  children, 
  className, 
  animate = true, 
  delay = 0 
}: ModernContainerProps) {
  return (
    <div 
      className={cn(
        "container-modern",
        animate && "animate-fade-in-up",
        className
      )}
      style={{
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}