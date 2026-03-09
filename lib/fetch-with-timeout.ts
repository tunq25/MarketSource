/**
 * Fetch with Timeout Wrapper
 * ✅ FIX: Prevent fetch from hanging indefinitely
 * Sử dụng AbortController để timeout requests
 */

import { logger } from './logger-client'

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number // Timeout in milliseconds (default: 10000 = 10s)
  retries?: number // Number of retries on timeout (default: 0)
  retryDelay?: number // Delay between retries in ms (default: 1000)
}

/**
 * Fetch with timeout support
 * @param url - Request URL
 * @param options - Fetch options + timeout, retries, retryDelay
 * @returns Promise<Response>
 * @throws Error with message "Request timeout" nếu timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const {
    timeout = 10000, // Default 10 seconds
    retries = 0,
    retryDelay = 1000,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
      }, timeout)

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)

        // Check if it's an abort error (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          const timeoutError = new Error(`Request timeout after ${timeout}ms`)
          timeoutError.name = 'TimeoutError'
          throw timeoutError
        }

        throw error
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Nếu không phải timeout error, throw ngay
      if (lastError.name !== 'TimeoutError') {
        throw lastError
      }

      // Nếu là timeout và còn retries, đợi rồi retry
      if (attempt < retries) {
        logger.warn(`Request timeout, retrying... (${attempt + 1}/${retries})`, {
          url,
          attempt: attempt + 1,
        })
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        continue
      }

      // Hết retries, throw error
      throw lastError
    }
  }

  // Should never reach here, but TypeScript needs this
  throw lastError || new Error('Unknown error')
}

/**
 * Fetch with timeout và parse JSON tự động
 */
export async function fetchJsonWithTimeout<T = unknown>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options)

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`HTTP ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

/**
 * Fetch với timeout và error handling tự động
 * Trả về { success: boolean, data?: T, error?: string }
 */
export async function fetchSafe<T = unknown>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await fetchJsonWithTimeout<T>(url, options)
    return { success: true, data }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    logger.error('Fetch failed', error, { url, options })
    return { success: false, error: errorMessage }
  }
}

