"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AnimatedElementProps {
  children: ReactNode
  animation?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleIn" | "float"
  delay?: number
  duration?: number
  className?: string
  trigger?: "load" | "scroll" | "hover"
}

export function AnimatedElement({
  children,
  animation = "fadeInUp",
  delay = 0,
  duration = 600,
  className,
  trigger = "load"
}: AnimatedElementProps) {
  const [isVisible, setIsVisible] = useState(trigger === "load")
  const [isHovered, setIsHovered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (trigger === "scroll") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        },
        { threshold: 0.1 }
      )

      if (elementRef.current) {
        observer.observe(elementRef.current)
      }

      return () => observer.disconnect()
    }
  }, [trigger])

  const animationClasses = {
    fadeInUp: "animate-fade-in-up",
    fadeInLeft: "animate-fade-in-left",
    fadeInRight: "animate-fade-in-right",
    scaleIn: "animate-scale-in",
    float: "animate-float"
  }

  const shouldAnimate = trigger === "hover" ? isHovered : isVisible

  return (
    <div
      ref={elementRef}
      className={cn(
        shouldAnimate && animationClasses[animation],
        trigger === "hover" && "cursor-pointer",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        opacity: shouldAnimate ? 1 : 0
      }}
      onMouseEnter={() => trigger === "hover" && setIsHovered(true)}
      onMouseLeave={() => trigger === "hover" && setIsHovered(false)}
    >
      {children}
    </div>
  )
}

interface StaggeredAnimationProps {
  children: ReactNode[]
  staggerDelay?: number
  animation?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleIn"
  className?: string
}

export function StaggeredAnimation({
  children,
  staggerDelay = 100,
  animation = "fadeInUp",
  className
}: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <AnimatedElement
          key={index}
          animation={animation}
          delay={index * staggerDelay}
          trigger="scroll"
        >
          {child}
        </AnimatedElement>
      ))}
    </div>
  )
}

export function FloatingElements({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <div className="absolute -top-4 -right-4 w-8 h-8 bg-muted rounded-full animate-float opacity-30" 
           style={{ animationDelay: "0s" }} />
      <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-muted rounded-full animate-float opacity-20" 
           style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 -left-8 w-4 h-4 bg-muted rounded-full animate-float opacity-25" 
           style={{ animationDelay: "2s" }} />
    </div>
  )
}

export function GlitchText({ children, className }: { children: ReactNode, className?: string }) {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 200)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={cn(
        "relative inline-block",
        isGlitching && "animate-pulse",
        className
      )}
    >
      {children}
      {isGlitching && (
        <>
          <div className="absolute inset-0 text-red-500 opacity-70 translate-x-0.5">
            {children}
          </div>
          <div className="absolute inset-0 text-blue-500 opacity-70 -translate-x-0.5">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export function TypewriterText({ 
  text, 
  speed = 50, 
  className 
}: { 
  text: string
  speed?: number
  className?: string 
}) {
  const [displayText, setDisplayText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed])

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

export function ParallaxContainer({ 
  children, 
  speed = 0.5, 
  className 
}: { 
  children: ReactNode
  speed?: number
  className?: string 
}) {
  const [offset, setOffset] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {
        const rect = elementRef.current.getBoundingClientRect()
        const scrolled = window.pageYOffset
        const rate = scrolled * -speed
        setOffset(rate)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed])

  return (
    <div
      ref={elementRef}
      className={cn("will-change-transform", className)}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  )
}