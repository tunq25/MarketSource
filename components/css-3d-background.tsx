"use client"

import { useState, useEffect } from 'react'

export function CSS3DBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Tech-inspired gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950"></div>
      
      {/* 3D CSS Code-themed Shapes */}
      <div className="absolute inset-0">
        {/* Floating Code Brackets {} */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-blue-500/30 dark:text-blue-400/40 font-mono text-4xl sm:text-5xl md:text-6xl font-bold flex items-center justify-center"
             style={{
               transform: 'perspective(1000px) rotateY(25deg) rotateX(15deg)',
               animation: 'float 6s ease-in-out infinite',
               textShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
             }}>
          {'{'}
        </div>
        
        <div className="absolute top-1/3 right-1/4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 text-indigo-500/30 dark:text-indigo-400/40 font-mono text-4xl sm:text-5xl md:text-6xl font-bold flex items-center justify-center"
             style={{
               transform: 'perspective(1000px) rotateY(-25deg) rotateX(-15deg)',
               animation: 'floatReverse 7s ease-in-out infinite',
               textShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
             }}>
          {'}'}
        </div>

        {/* Floating HTML Tags </> */}
        <div className="absolute bottom-1/3 left-1/3 w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 text-emerald-500/30 dark:text-emerald-400/40 font-mono text-2xl sm:text-3xl md:text-4xl font-bold flex items-center justify-center"
             style={{
               transform: 'perspective(1000px) rotateY(20deg) rotateX(10deg)',
               animation: 'float 8s ease-in-out infinite',
               textShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
             }}>
          {'</>'}
        </div>

        {/* Floating 3D Cubes (representing modules/packages) */}
        <div className="absolute top-1/2 right-1/3 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
          <div className="w-full h-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 dark:from-cyan-500/40 dark:to-blue-600/40 transform-gpu shadow-lg border border-cyan-300/20 dark:border-cyan-400/20"
               style={{
                 transform: 'perspective(1000px) rotateX(45deg) rotateY(45deg) rotateZ(0deg)',
                 animation: 'float 9s ease-in-out infinite'
               }}>
          </div>
        </div>

        {/* Terminal Window Shape */}
        <div className="absolute bottom-1/4 right-1/4 w-20 h-14 sm:w-24 sm:h-16 md:w-28 md:h-20">
          <div className="w-full h-full bg-gradient-to-br from-slate-700/20 to-slate-900/30 dark:from-slate-600/30 dark:to-slate-800/40 rounded-lg shadow-lg border border-slate-500/20"
               style={{
                 transform: 'perspective(1000px) rotateX(20deg) rotateY(-15deg)',
                 animation: 'floatReverse 7s ease-in-out infinite'
               }}>
            <div className="flex gap-1 p-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400/50"></div>
              <div className="w-2 h-2 rounded-full bg-green-400/50"></div>
            </div>
          </div>
        </div>

        {/* Binary Code Pattern */}
        <div className="absolute top-1/3 left-1/2 text-purple-500/20 dark:text-purple-400/30 font-mono text-xs sm:text-sm"
             style={{
               transform: 'perspective(1000px) rotateX(30deg)',
               animation: 'float 10s ease-in-out infinite'
             }}>
          01010101<br/>
          10101010
        </div>

        {/* Function Arrow => */}
        <div className="absolute bottom-1/2 left-1/4 text-violet-500/30 dark:text-violet-400/40 font-mono text-3xl sm:text-4xl md:text-5xl font-bold"
             style={{
               transform: 'perspective(1000px) rotateY(15deg)',
               animation: 'floatReverse 6s ease-in-out infinite',
               textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
             }}>
          {'=>'}
        </div>

        {/* Git Branch Symbol */}
        <div className="absolute top-2/3 right-1/2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12">
          <div className="w-full h-full relative"
               style={{
                 transform: 'perspective(1000px) rotateX(20deg)',
                 animation: 'float 8s ease-in-out infinite'
               }}>
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-orange-500/40 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-orange-500/40 rounded-full"></div>
            <div className="absolute bottom-0 left-1/4 w-2 h-2 bg-orange-500/40 rounded-full"></div>
            <div className="absolute top-1 left-1/2 w-0.5 h-1/2 bg-orange-500/30"></div>
          </div>
        </div>

        {/* Semicolon ; */}
        <div className="absolute bottom-1/3 right-1/3 text-rose-500/30 dark:text-rose-400/40 font-mono text-5xl sm:text-6xl md:text-7xl font-bold"
             style={{
               transform: 'perspective(1000px) rotateX(25deg)',
               animation: 'float 5s ease-in-out infinite',
               textShadow: '0 0 20px rgba(244, 63, 94, 0.3)'
             }}>
          ;
        </div>
      </div>

      {/* Animated Code Particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute font-mono text-xs text-blue-400/20 dark:text-blue-300/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${4 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              transform: 'perspective(1000px) translateZ(0)'
            }}
          >
            {['0', '1', '{', '}', '<', '>', '/', '*'][Math.floor(Math.random() * 8)]}
          </div>
        ))}
      </div>

      {/* Animated Tech Background Orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-blue-400/5 dark:bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-indigo-400/5 dark:bg-indigo-500/10 rounded-full blur-3xl animate-float-reverse"></div>
        <div className="absolute top-1/2 right-1/3 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 bg-cyan-400/5 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse-glow"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
           style={{
             backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>
    </div>
  )
}

// Add these keyframes to your global CSS
/*
@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50% { transform: translateY(-20px) translateX(10px); }
}

@keyframes floatReverse {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  50% { transform: translateY(20px) translateX(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.05); }
}
*/