/**
 * Client-side Logger Service
 * Thay thế console.log/error/warn trong frontend
 * Tự động gửi errors lên server (tùy chọn)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  level?: LogLevel
  tags?: string[]
  metadata?: Record<string, unknown>
  sendToServer?: boolean // Có gửi lên server không
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'
  
  /**
   * Log debug message (chỉ trong development)
   */
  debug(message: string, metadata?: Record<string, unknown>) {
    if (!this.isDevelopment) return
    console.debug(`[DEBUG] ${message}`, metadata || '')
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>) {
    if (!this.isDevelopment) return
    console.info(`[INFO] ${message}`, metadata || '')
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>, options?: LogOptions) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, metadata || '')
    }
    
    // Trong production, có thể gửi warnings lên server
    if (this.isProduction && options?.sendToServer) {
      this.sendToServer('warn', message, metadata, options)
    }
  }

  /**
   * Log error message
   * Trong production, tự động gửi lên server
   */
  async error(
    message: string,
    error?: Error | unknown,
    metadata?: Record<string, unknown>,
    options?: LogOptions
  ) {
    // Log error trong console
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, metadata || '')
    } else {
      // Production: chỉ log error message, không log full error
      console.error(`[ERROR] ${message}`)
    }

    // Trong production, tự động gửi errors lên server
    if (this.isProduction) {
      try {
        await this.sendToServer('error', message, {
          ...metadata,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          } : error,
        }, options)
      } catch (err) {
        // Không log lỗi khi gửi log lên server (tránh infinite loop)
      }
    }
  }

  /**
   * Gửi log lên server
   */
  private async sendToServer(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    options?: LogOptions
  ) {
    // Chỉ gửi errors và warnings quan trọng
    if (level !== 'error' && level !== 'warn') return

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          message,
          metadata: {
            ...metadata,
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            timestamp: new Date().toISOString(),
            tags: options?.tags || [],
          },
        }),
        // Không block UI nếu request fail
        keepalive: true,
      }).catch(() => {
        // Ignore fetch errors
      })
    } catch {
      // Ignore errors khi gửi log
    }
  }

  /**
   * Group logs (chỉ trong development)
   */
  group(label: string) {
    if (this.isDevelopment && console.group) {
      console.group(label)
    }
  }

  groupEnd() {
    if (this.isDevelopment && console.groupEnd) {
      console.groupEnd()
    }
  }
}

// Export singleton instance
export const logger = new ClientLogger()

// Export type cho TypeScript
export type { LogLevel, LogOptions }

