"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AnimatedElement, TypewriterText, FloatingElements } from "./ui/modern-animations"
import { ModernButton } from "./ui/modern-button"
import { ModernContainer } from "./ui/modern-container"

interface ModernHeroProps {
  title: string | ReactNode
  subtitle?: string
  description?: string
  primaryAction?: {
    text: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    text: string
    href?: string
    onClick?: () => void
  }
  image?: string
  video?: string
  className?: string
  animated?: boolean
}

export function ModernHero({
  title,
  subtitle,
  description,
  primaryAction,
  secondaryAction,
  image,
  video,
  className,
  animated = true
}: ModernHeroProps) {
  return (
    <section className={cn(
      "relative min-h-screen flex items-center justify-center gradient-bg overflow-hidden",
      className
    )}>
      {/* Background Media */}
      {video && (
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      
      {image && !video && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}

      {/* Floating Elements */}
      <FloatingElements className="absolute inset-0">
        <></>
      </FloatingElements>

      <ModernContainer className="relative z-10 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Subtitle */}
          {subtitle && (
            <AnimatedElement
              animation="fadeInUp"
              delay={animated ? 0 : undefined}
              className="inline-block"
            >
              <span className="inline-flex items-center px-4 py-2 bg-muted rounded-full text-sm font-medium">
                {subtitle}
              </span>
            </AnimatedElement>
          )}

          {/* Title */}
          <AnimatedElement
            animation="fadeInUp"
            delay={animated ? 200 : 0}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold modern-heading leading-tight">
              {typeof title === "string" && animated ? (
                <TypewriterText text={title} speed={100} />
              ) : (
                title
              )}
            </h1>
          </AnimatedElement>

          {/* Description */}
          {description && (
            <AnimatedElement
              animation="fadeInUp"
              delay={animated ? 400 : 0}
            >
              <p className="text-lg md:text-xl modern-text max-w-2xl mx-auto">
                {description}
              </p>
            </AnimatedElement>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <AnimatedElement
              animation="fadeInUp"
              delay={animated ? 600 : 0}
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {primaryAction && (
                  <ModernButton
                    size="lg"
                    onClick={primaryAction.onClick}
                    className="px-8 py-4 text-lg"
                  >
                    {primaryAction.text}
                  </ModernButton>
                )}
                
                {secondaryAction && (
                  <ModernButton
                    variant="outline"
                    size="lg"
                    onClick={secondaryAction.onClick}
                    className="px-8 py-4 text-lg"
                  >
                    {secondaryAction.text}
                  </ModernButton>
                )}
              </div>
            </AnimatedElement>
          )}
        </div>
      </ModernContainer>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-foreground rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  )
}