"use client"

import { ReactNode, HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

interface ModernCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  glass?: boolean
  animate?: boolean
  delay?: number
}

export function ModernCard({ 
  children, 
  className, 
  hover = true, 
  glass = false,
  animate = true,
  delay = 0,
  ...props 
}: ModernCardProps) {
  return (
    <div 
      className={cn(
        "modern-card",
        glass && "glass-effect",
        animate && "animate-scale-in",
        className
      )}
      style={{
        animationDelay: `${delay}ms`
      }}
      {...props}
    >
      {children}
    </div>
  )
}

export function ModernCardHeader({ 
  children, 
  className, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-4", className)} {...props}>
      {children}
    </div>
  )
}

export function ModernCardContent({ 
  children, 
  className, 
  ...props 
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  )
}

export function ModernCardTitle({ 
  children, 
  className, 
  ...props 
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("modern-heading text-xl font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

export function ModernCardDescription({ 
  children, 
  className, 
  ...props 
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("modern-text text-sm mt-2", className)} {...props}>
      {children}
    </p>
  )
}