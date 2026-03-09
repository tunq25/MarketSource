"use client"

import React, { useEffect, useState, Suspense, lazy } from 'react'

// Lazy load Three.js scene với React.lazy để tránh lỗi ReactCurrentOwner
// Chỉ load khi component thực sự render, không trong module evaluation
const ThreeJSCanvas = lazy(() => 
  import('@/components/three-js-scene').then(mod => ({ default: mod.ThreeJSCanvas }))
)

// Main component
export function ThreeJSBackground() {
  const [mounted, setMounted] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Đảm bảo React context đã sẵn sàng trước khi load Three.js
    setMounted(true)
    
    // Thêm delay nhỏ để đảm bảo React context hoàn toàn sẵn sàng
    const timer = setTimeout(() => {
      setShouldLoad(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return (
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Fallback gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/80 via-blue-50/40 to-indigo-50/80 dark:from-slate-950/80 dark:via-blue-950/40 dark:to-indigo-950/80"></div>
      
      {/* Three.js Canvas - Lazy loaded với Suspense */}
      {shouldLoad && (
        <Suspense fallback={null}>
          <ThreeJSCanvas />
        </Suspense>
      )}
    </div>
  )
}