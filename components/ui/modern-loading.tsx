"use client"

import { cn } from "@/lib/utils"

interface ModernLoadingProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "spinner" | "dots" | "pulse" | "shimmer"
}

export function ModernLoading({ 
  className, 
  size = "md", 
  variant = "spinner" 
}: ModernLoadingProps) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className={cn(
          "border-2 border-muted border-t-foreground rounded-full animate-spin",
          sizes[size]
        )} />
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center space-x-1", className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-foreground rounded-full animate-pulse",
              size === "sm" && "w-1 h-1",
              size === "md" && "w-2 h-2",
              size === "lg" && "w-3 h-3"
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn(
        "bg-muted rounded animate-pulse",
        sizes[size],
        className
      )} />
    )
  }

  if (variant === "shimmer") {
    return (
      <div className={cn(
        "loading-shimmer rounded",
        sizes[size],
        className
      )} />
    )
  }

  return null
}

export function ModernLoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn("modern-card p-6 space-y-4", className)}>
      <div className="loading-shimmer h-4 rounded w-3/4" />
      <div className="loading-shimmer h-4 rounded w-1/2" />
      <div className="loading-shimmer h-20 rounded w-full" />
    </div>
  )
}

export function ModernLoadingList({ items = 3, className }: { items?: number, className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <div className="loading-shimmer w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="loading-shimmer h-4 rounded w-3/4" />
            <div className="loading-shimmer h-3 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}