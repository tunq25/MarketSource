/**
 * Wrapper để thay thế console.log/error/warn dễ dàng
 * Sử dụng: import { log, error, warn } from '@/lib/logger-client-wrapper'
 */

import { logger } from './logger-client'

// Simple wrapper functions
export const log = logger.info.bind(logger)
export const error = logger.error.bind(logger)
export const warn = logger.warn.bind(logger)
export const debug = logger.debug.bind(logger)

// Export logger instance nếu cần
export { logger }

