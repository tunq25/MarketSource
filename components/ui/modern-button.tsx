"use client"

import { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ModernButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  animate?: boolean
}

export function ModernButton({ 
  children, 
  className, 
  variant = "primary",
  size = "md",
  loading = false,
  animate = true,
  disabled,
  ...props 
}: ModernButtonProps) {
  const baseClasses = "modern-btn modern-focus relative inline-flex items-center justify-center font-medium transition-all duration-300"
  
  const variants = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    secondary: "bg-muted text-muted-foreground hover:bg-muted/80",
    outline: "border-2 border-foreground text-foreground hover:bg-foreground hover:text-background",
    ghost: "text-foreground hover:bg-muted"
  }
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm h-8",
    md: "px-4 py-2 text-sm h-10",
    lg: "px-6 py-3 text-base h-12"
  }

  return (
    <button 
      className={cn(
        baseClasses,
        variants[variant],
        sizes[size],
        animate && "will-change-transform",
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={cn(loading && "opacity-0")}>
        {children}
      </span>
    </button>
  )
}