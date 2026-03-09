"use client"

import { InputHTMLAttributes, ReactNode, forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ModernInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  animate?: boolean
}

export const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  ({ className, label, error, icon, animate = true, ...props }, ref) => {
    return (
      <div className={cn("space-y-2", animate && "animate-fade-in-up")}>
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            className={cn(
              "modern-input modern-focus w-full",
              icon && "pl-10",
              error && "border-destructive focus:border-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive animate-fade-in-up">
            {error}
          </p>
        )}
      </div>
    )
  }
)

ModernInput.displayName = "ModernInput"