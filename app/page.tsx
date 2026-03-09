"use client"

import dynamic from "next/dynamic"

const HeroSection = dynamic(() => import("@/components/hero-section").then(mod => ({ default: mod.HeroSection })), {
  ssr: false,
})
import { FeaturesSection } from "@/components/features-section"
import { ProductsSection } from "@/components/products-section"
import { StatsSection } from "@/components/stats-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { FloatingHeader } from "@/components/floating-header"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 relative">
      {/* 3D Liquid Background */}
      <div className="liquid-3d-bg" />
      <FloatingHeader />
      <main className="pt-20 md:pt-24 relative z-10">
        <div className="animate-fade-in-up">
          <HeroSection />
        </div>
        <div className="animate-fade-in-up delay-100">
          <StatsSection />
        </div>
        <div className="animate-fade-in-up delay-200">
          <FeaturesSection />
        </div>
        <div className="animate-fade-in-up delay-300">
            <ProductsSection />
        </div>
        <div className="animate-fade-in-up delay-400">
          <TestimonialsSection />
        </div>
      </main>
      <Footer />
    </div>
  )
}
