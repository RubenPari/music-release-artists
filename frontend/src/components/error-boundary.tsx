/**
 * Error Boundary Component
 * 
 * @description React 19 Error Boundary for graceful error handling
 * with support for reset functionality.
 */

import { Component, type ReactNode } from 'react'
import * as React from "react";

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component that catches JavaScript errors
 * in child components and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call optional onError callback
    this.props.onError?.(error, errorInfo)
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }
      
      // Default fallback UI
      return (
        <div className="flex min-h-50 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Qualcosa è andato storto
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              {this.state.error.message || 'Si è verificato un errore imprevisto.'}
            </p>
            <button
              onClick={this.reset}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              Riprova
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
