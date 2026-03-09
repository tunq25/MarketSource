"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface ModernNavProps {
  children: ReactNode
  className?: string
}

export function ModernNav({ children, className }: ModernNavProps) {
  return (
    <nav className={cn("modern-nav sticky top-0 z-50", className)}>
      <div className="container-modern">
        <div className="flex items-center justify-between h-16">
          {children}
        </div>
      </div>
    </nav>
  )
}

interface ModernNavItemProps {
  href: string
  children: ReactNode
  active?: boolean
  className?: string
}

export function ModernNavItem({ 
  href, 
  children, 
  active, 
  className 
}: ModernNavItemProps) {
  const pathname = usePathname()
  const isActive = active ?? pathname === href

  return (
    <Link 
      href={href}
      className={cn(
        "modern-nav-item",
        isActive && "bg-muted",
        className
      )}
    >
      {children}
    </Link>
  )
}

export function ModernNavBrand({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn("font-bold text-xl modern-heading", className)}>
      {children}
    </div>
  )
}

export function ModernNavItems({ 
  children, 
  className 
}: { 
  children: ReactNode
  className?: string 
}) {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {children}
    </div>
  )
}