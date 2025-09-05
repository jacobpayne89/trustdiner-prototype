/**
 * Enhanced error tracking and reporting for TrustDiner Frontend
 * Provides structured error logging, user feedback, and debugging information
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorContext {
  userId?: string | number;
  sessionId?: string;
  component?: string;
  action?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  fingerprint: string;
  timestamp: string;
  environment: string;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private isDevelopment = process.env.NODE_ENV === 'development';

  private generateErrorId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const key = `${error.name}:${error.message}:${context.component || 'unknown'}`;
    return btoa(key).substring(0, 16);
  }

  private getStackTrace(error: Error): string {
    if (error.stack) {
      // Clean up the stack trace for better readability
      return error.stack
        .split('\n')
        .slice(0, 10) // Limit to first 10 lines
        .map(line => line.trim())
        .join('\n');
    }
    return 'No stack trace available';
  }

  captureError(
    error: Error,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {}
  ): string {
    const errorId = this.generateErrorId();
    const fingerprint = this.generateFingerprint(error, context);
    
    const errorReport: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: this.getStackTrace(error),
      severity,
      context: {
        ...context,
        url: window?.location?.href,
        userAgent: navigator?.userAgent,
        timestamp: new Date().toISOString(),
      },
      fingerprint,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    this.errors.push(errorReport);

    // Log to console in development
    if (this.isDevelopment) {
      const emoji = this.getSeverityEmoji(severity);
      console.group(`${emoji} Error Captured [${severity}] - ${errorId}`);
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      console.error('Context:', context);
      console.groupEnd();
    }

    // In production, you could send to error reporting service
    if (!this.isDevelopment) {
      this.sendToErrorService(errorReport);
    }

    // Show user-friendly notification for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      this.showUserNotification(error, errorId);
    }

    return errorId;
  }

  private getSeverityEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW: return '💡';
      case ErrorSeverity.MEDIUM: return '⚠️';
      case ErrorSeverity.HIGH: return '🚨';
      case ErrorSeverity.CRITICAL: return '💥';
      default: return '❓';
    }
  }

  private async sendToErrorService(errorReport: ErrorReport): Promise<void> {
    try {
      // In a real application, you'd send to Sentry, LogRocket, etc.
      // For now, we'll just send to our backend if available
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport),
      });
    } catch (sendError) {
      console.error('Failed to send error report:', sendError);
    }
  }

  private showUserNotification(error: Error, errorId: string): void {
    // Show a user-friendly notification
    if (typeof window !== 'undefined') {
      const message = `An unexpected error occurred. Error ID: ${errorId}`;
      
      // Try to use browser notification API if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('TrustDiner Error', {
          body: message,
          icon: '/favicon.ico',
        });
      } else {
        // Fallback to console or could create a toast notification
        console.error('Critical Error:', message);
      }
    }
  }

  // Specialized error capture methods
  captureAPIError(
    error: Error,
    endpoint: string,
    method: string = 'GET',
    statusCode?: number,
    context: ErrorContext = {}
  ): string {
    return this.captureError(error, ErrorSeverity.HIGH, {
      ...context,
      type: 'api_error',
      endpoint,
      method,
      statusCode,
    });
  }

  captureComponentError(
    error: Error,
    componentName: string,
    action?: string,
    context: ErrorContext = {}
  ): string {
    return this.captureError(error, ErrorSeverity.MEDIUM, {
      ...context,
      type: 'component_error',
      component: componentName,
      action,
    });
  }

  captureUserActionError(
    error: Error,
    action: string,
    userId?: string | number,
    context: ErrorContext = {}
  ): string {
    return this.captureError(error, ErrorSeverity.MEDIUM, {
      ...context,
      type: 'user_action_error',
      action,
      userId,
    });
  }

  captureValidationError(
    error: Error,
    field: string,
    value?: any,
    context: ErrorContext = {}
  ): string {
    return this.captureError(error, ErrorSeverity.LOW, {
      ...context,
      type: 'validation_error',
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value,
    });
  }

  // Error boundary integration
  captureReactError(
    error: Error,
    errorInfo: { componentStack: string },
    context: ErrorContext = {}
  ): string {
    return this.captureError(error, ErrorSeverity.HIGH, {
      ...context,
      type: 'react_error',
      componentStack: errorInfo.componentStack,
    });
  }

  // Get error reports for debugging
  getErrors(limit: number = 50): ErrorReport[] {
    return this.errors.slice(-limit);
  }

  getErrorsByFingerprint(fingerprint: string): ErrorReport[] {
    return this.errors.filter(error => error.fingerprint === fingerprint);
  }

  clearErrors(): void {
    this.errors = [];
  }

  // Error boundary helper
  createErrorBoundary() {
    return class ErrorBoundary extends React.Component<
      { children: React.ReactNode; componentName?: string },
      { hasError: boolean; errorId?: string }
    > {
      constructor(props: any) {
        super(props);
        this.state = { hasError: false };
      }

      static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        const errorId = errorTracker.captureReactError(error, errorInfo, {
          component: this.props.componentName,
        });
        this.setState({ errorId });
      }

      render() {
        if (this.state.hasError) {
          return (
            <div className="error-boundary p-4 border border-red-300 rounded-lg bg-red-50">
              <h3 className="text-red-800 font-medium mb-2">Something went wrong</h3>
              <p className="text-red-600 text-sm mb-3">
                An unexpected error occurred in this component.
              </p>
              {this.state.errorId && (
                <p className="text-red-500 text-xs font-mono">
                  Error ID: {this.state.errorId}
                </p>
              )}
              <button
                className="mt-3 px-3 py-1 bg-red-600 text-white rounded text-sm"
                onClick={() => this.setState({ hasError: false, errorId: undefined })}
              >
                Try Again
              </button>
            </div>
          );
        }

        return this.props.children;
      }
    };
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Global error handler setup
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureError(
      new Error(event.message),
      ErrorSeverity.HIGH,
      {
        type: 'global_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureError(
      new Error(event.reason?.message || 'Unhandled Promise Rejection'),
      ErrorSeverity.HIGH,
      {
        type: 'unhandled_rejection',
        reason: event.reason,
      }
    );
  });
}

// React import (only if React is available)
let React: any;
try {
  React = require('react');
} catch (e) {
  // React not available, skip error boundary creation
}