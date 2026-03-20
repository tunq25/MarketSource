/**
 * Logger Service
 * ✅ PERFORMANCE FIX: Centralized logging với sanitization và structured logging
 * - Development: Full logs
 * - Production: Sanitized logs only (no sensitive data)
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'error');

interface LogContext {
  [key: string]: any;
}

/**
 * Sanitize log data để không expose sensitive information
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'auth',
    'authorization',
    'cookie',
    'credit_card',
    'cvv',
    'ssn',
    'email',
    'phone',
    'mobile',
    'address',
    'account',
    'card',
    'hash',
    'otp'
  ];

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log message với context
 */
function formatMessage(level: string, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(sanitizeData(context))}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  /**
   * Info logs - chỉ trong development
   */
  info: (message: string, context?: LogContext) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') {
      console.log(formatMessage('info', message, context));
    }
  },

  /**
   * Error logs - luôn log (production-safe)
   */
  error: (message: string, error?: unknown, context?: LogContext) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error && isDevelopment ? error.stack : undefined;
    
    const errorContext = {
      ...context,
      error: errorMessage,
      ...(errorStack && { stack: errorStack }),
    };

    console.error(formatMessage('error', message, errorContext));
    
    // TODO: Send to external logging service (Sentry, LogRocket, etc.) in production
    // if (!isDevelopment && process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: context });
    // }
  },

  /**
   * Warn logs - chỉ trong development hoặc khi cần thiết
   */
  warn: (message: string, context?: LogContext) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info' || LOG_LEVEL === 'warn') {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Debug logs - chỉ trong development
   */
  debug: (message: string, context?: LogContext) => {
    if (LOG_LEVEL === 'debug') {
      console.debug(formatMessage('debug', message, context));
    }
  },

  /**
   * Performance logging
   */
  performance: (operation: string, duration: number, context?: LogContext) => {
    if (LOG_LEVEL === 'debug') {
      const emoji = duration > 1000 ? '🐌' : duration > 500 ? '⚠️' : '✅';
      console.log(
        formatMessage('perf', `${emoji} ${operation} took ${duration}ms`, context)
      );
    }
  },
};

