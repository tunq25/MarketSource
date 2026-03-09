/**
 * Error Handler Utilities
 * ✅ SECURITY FIX: Sanitize error messages trong production
 */

import { logger } from './logger';

/**
 * Sanitize error message để không leak sensitive information
 */
export function sanitizeError(error: unknown, isDevelopment: boolean = false): string {
  if (isDevelopment) {
    // Development: Show full error for debugging
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  // Production: Generic error message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Check for sensitive patterns
    const sensitivePatterns = [
      'sql',
      'database',
      'connection',
      'password',
      'token',
      'secret',
      'api key',
      'auth',
      'unauthorized',
      'forbidden',
      'stack trace',
    ];

    // If error contains sensitive info, return generic message
    if (sensitivePatterns.some(pattern => message.includes(pattern))) {
      return 'An error occurred. Please try again later.';
    }

    // Return sanitized message (remove stack traces, file paths, etc.)
    return error.message.split('\n')[0].trim();
  }

  return 'An error occurred. Please try again later.';
}

/**
 * Create safe error response object
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): { success: false; error: string } {
  return {
    success: false,
    error: sanitizeError(error, isDevelopment),
  };
}

/**
 * Log error với sanitization
 */
export function logError(context: string, error: unknown) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isDevelopment) {
    logger.error(`[${context}]`, error);
  } else {
    // Production: Log sanitized error
    const sanitized = sanitizeError(error, false);
    logger.error(`[${context}]`, sanitized);
    
    // Log to external service (Sentry, LogRocket, etc.) if needed
    // Example: Sentry.captureException(error);
  }
}

