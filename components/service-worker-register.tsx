"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Chỉ register service worker trong production hoặc khi cần
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/sw.js')
          .then((_registration) => {
            // Service Worker registered successfully
          })
          .catch((_error) => {
            // Silent error for sw registration
          })
      }
    }
  }, [])

  return null
}

