"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function CustomCursor() {
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

  useEffect(() => {
    setMounted(true)
    
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!target) return false
      
      // Check if target is an Element (not just HTMLElement, but also SVGElement)
      if (!(target instanceof Element)) return false
      
      const element = target
      const tagName = element.tagName?.toUpperCase() || ''
      
      // Check tagName first (no closest needed)
      if (tagName === 'A' || tagName === 'BUTTON') {
        return true
      }
      
      // Check if element has closest method (some elements like SVGElement might not have it)
      if (typeof (element as any).closest !== 'function') {
        return false
      }
      
      // Use closest with try-catch for safety
      try {
        return !!(
          element.closest('button') ||
          element.closest('a') ||
          element.closest('[role="button"]') ||
          element.closest('.cursor-pointer')
        )
      } catch {
        return false
      }
    }

    const handleMouseOver = (e: MouseEvent) => {
      try {
        if (isInteractiveElement(e.target)) {
          setIsHovering(true)
        }
      } catch (err) {
        // Silently ignore errors
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      try {
        if (isInteractiveElement(e.target)) {
          setIsHovering(false)
        }
      } catch (err) {
        // Silently ignore errors
      }
    }

    window.addEventListener('mousemove', updateMousePosition)
    document.addEventListener('mouseover', handleMouseOver, true)
    document.addEventListener('mouseout', handleMouseOut, true)

    return () => {
      window.removeEventListener('mousemove', updateMousePosition)
      document.removeEventListener('mouseover', handleMouseOver, true)
      document.removeEventListener('mouseout', handleMouseOut, true)
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      {/* Custom Cursor */}
      <div
        className="fixed pointer-events-none z-[9999] mix-blend-difference"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s ease, height 0.2s ease, opacity 0.2s ease',
        }}
      >
        <div
          className={`rounded-full ${
            isHovering
              ? 'w-8 h-8 bg-white/20 backdrop-blur-sm border-2 border-white/40'
              : 'w-4 h-4 bg-white/80 backdrop-blur-sm border border-white/60'
          }`}
          style={{
            boxShadow: isDark
              ? '0 0 20px rgba(255, 255, 255, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'
              : '0 0 20px rgba(0, 0, 0, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.5)',
          }}
        />
      </div>

      {/* Cursor Follower - Liquid Glass Effect */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div
          className={`rounded-full ${
            isHovering ? 'w-12 h-12' : 'w-8 h-8'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 100%)'
              : 'radial-gradient(circle, rgba(128, 128, 128, 0.15) 0%, rgba(128, 128, 128, 0.05) 50%, transparent 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(128, 128, 128, 0.1)',
            boxShadow: isDark
              ? '0 8px 32px rgba(255, 255, 255, 0.1), inset 0 0 40px rgba(255, 255, 255, 0.05)'
              : '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 40px rgba(255, 255, 255, 0.3)',
          }}
        />
      </div>

      {/* Outer Glow Layer */}
      <div
        className="fixed pointer-events-none z-[9997]"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`,
          transform: 'translate(-50%, -50%)',
          transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div
          className={`rounded-full ${
            isHovering ? 'w-16 h-16' : 'w-12 h-12'
          }`}
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(128, 128, 128, 0.08) 0%, transparent 70%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            opacity: isHovering ? 0.6 : 0.4,
          }}
        />
      </div>
    </>
  )
}

