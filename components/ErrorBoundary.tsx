"use client"

import React, { Component, ErrorInfo } from 'react';
import { logger } from '@/lib/logger-client';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Chỉ log nếu logger có sẵn (tránh lỗi khi logger chưa init)
    try {
      if (logger && typeof logger.error === 'function') {
    logger.error('React Error Boundary caught an error', error, { errorInfo });
      }
    } catch (e) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const isDatabaseError = errorMessage.includes('Database') || 
                              errorMessage.includes('ENOTFOUND') ||
                              errorMessage.includes('connection failed') ||
                              errorMessage.includes('Pool instance is null');
      
      const isReactError = errorMessage.includes('ReactCurrentBatchConfig') ||
                          errorMessage.includes('ReactCurrentOwner') ||
                          errorMessage.includes('Cannot read properties of undefined') ||
                          errorMessage.includes('reading \'ReactCurrentOwner\'');
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Đã xảy ra lỗi
            </h1>
            {isDatabaseError ? (
              <div className="mb-4">
                <p className="text-red-600 dark:text-red-400 mb-2 font-semibold">
                  ⚠️ Lỗi kết nối database
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Vui lòng kiểm tra environment variables trên Netlify (DATABASE_URL hoặc DB_* variables).
                </p>
              </div>
            ) : isReactError ? (
              <div className="mb-4">
                <p className="text-yellow-600 dark:text-yellow-400 mb-2 font-semibold">
                  ⚠️ Lỗi React
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Đã xảy ra lỗi với React. Vui lòng tải lại trang để khắc phục.
                </p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vui lòng tải lại trang hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
              </p>
            )}
            <div className="flex gap-2 justify-center">
            <button
                onClick={() => {
                  // Clear error state and reload
                  this.setState({ hasError: false, error: undefined });
                  window.location.reload();
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Tải lại trang
            </button>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Thử lại
              </button>
            </div>
            {(process.env.NODE_ENV === 'development' || isReactError) && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400">
                  Chi tiết lỗi {isReactError ? '(React Error)' : '(dev only)'}
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                  {errorMessage}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

