"use client"

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from "@/lib/logger-client"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ThreeJSErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Three.js Error:', error, {
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100/30 via-pink-100/20 to-blue-100/30 dark:from-purple-900/50 dark:via-pink-900/30 dark:to-blue-900/50">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎨</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    3D Background Loading...
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
