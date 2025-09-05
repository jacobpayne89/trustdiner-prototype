/**
 * Backend Error Tracking Service
 * 
 * Provides centralized error logging and monitoring for the backend.
 * Currently stubbed for future integration with Sentry, Rollbar, or similar services.
 */

import { logger } from './logger';

export interface ErrorContext {
  userId?: string | number;
  endpoint?: string;
  method?: string;
  requestId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface BackendErrorTrackingService {
  logError(error: Error, context?: ErrorContext): void;
  logWarning(message: string, context?: ErrorContext): void;
  logInfo(message: string, context?: ErrorContext): void;
  setUserContext(userId: string | number, userInfo?: Record<string, any>): void;
  addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): void;
}

/**
 * Logger-based error tracking (development/fallback)
 */
class LoggerErrorTracker implements BackendErrorTrackingService {
  logError(error: Error, context?: ErrorContext): void {
    logger.error('Backend Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  logWarning(message: string, context?: ErrorContext): void {
    logger.warn('Backend Warning', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  logInfo(message: string, context?: ErrorContext): void {
    logger.info('Backend Info', {
      message,
      context,
      timestamp: new Date().toISOString()
    });
  }

  setUserContext(userId: string | number, userInfo?: Record<string, any>): void {
    logger.info('User context set', { userId, userInfo });
  }

  addBreadcrumb(message: string, category = 'general', level: 'info' | 'warning' | 'error' = 'info'): void {
    if (level === 'error') {
      logger.error(`Breadcrumb [${category}]: ${message}`);
    } else if (level === 'warning') {
      logger.warn(`Breadcrumb [${category}]: ${message}`);
    } else {
      logger.info(`Breadcrumb [${category}]: ${message}`);
    }
  }
}

/**
 * Sentry error tracking (production implementation)
 */
class SentryBackendErrorTracker implements BackendErrorTrackingService {
  private initialized = false;

  constructor() {
    try {
      if (process.env.SENTRY_DSN) {
        // Dynamic import to avoid issues when Sentry is not installed
        const Sentry = require('@sentry/node');
        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV || 'development',
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: undefined }),
          ],
        });
        this.initialized = true;
        logger.info('Sentry error tracking initialized');
      } else {
        logger.warn('SENTRY_DSN not provided, using logger fallback');
      }
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  }

  logError(error: Error, context?: ErrorContext): void {
    if (!this.initialized) {
      logger.error('Sentry not initialized, falling back to logger', { error: error.message, context });
      return;
    }
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.withScope((scope: any) => {
        if (context?.userId) scope.setUser({ id: context.userId.toString() });
        if (context?.endpoint) scope.setTag('endpoint', context.endpoint);
        if (context?.method) scope.setTag('method', context.method);
        if (context?.requestId) scope.setTag('requestId', context.requestId);
        if (context?.component) scope.setTag('component', context.component);
        if (context?.action) scope.setTag('action', context.action);
        if (context?.metadata) scope.setContext('metadata', context.metadata);
        Sentry.captureException(error);
      });
    } catch (sentryError) {
      logger.error('Sentry error logging failed:', sentryError);
      logger.error('Original error:', { error: error.message, context });
    }
  }

  logWarning(message: string, context?: ErrorContext): void {
    if (!this.initialized) {
      logger.warn('Sentry not initialized, falling back to logger', { message });
      return;
    }
    
    // TODO: Implement Sentry warning logging
    // Sentry.captureMessage(message, 'warning');
  }

  logInfo(message: string, context?: ErrorContext): void {
    if (!this.initialized) {
      logger.info('Sentry not initialized, falling back to logger', { message });
      return;
    }
    
    // TODO: Implement Sentry info logging
    // Sentry.captureMessage(message, 'info');
  }

  setUserContext(userId: string | number, userInfo?: Record<string, any>): void {
    if (!this.initialized) {
      logger.info('Sentry not initialized, user context not set');
      return;
    }
    
    // TODO: Implement Sentry user context
    // Sentry.setUser({
    //   id: userId.toString(),
    //   ...userInfo
    // });
  }

  addBreadcrumb(message: string, category = 'general', level: 'info' | 'warning' | 'error' = 'info'): void {
    if (!this.initialized) return;
    
    // TODO: Implement Sentry breadcrumbs
    // Sentry.addBreadcrumb({
    //   message,
    //   category,
    //   level: level as any,
    //   timestamp: Date.now() / 1000
    // });
  }
}

// Create the error tracking instance
const createBackendErrorTracker = (): BackendErrorTrackingService => {
  // Use Sentry in production if DSN is provided
  if (process.env.SENTRY_DSN) {
    return new SentryBackendErrorTracker();
  }
  
  return new LoggerErrorTracker();
};

export const backendErrorTracker = createBackendErrorTracker();

/**
 * Convenience functions for common error tracking scenarios
 */
export const logErrorToService = (error: Error, context?: ErrorContext) => {
  backendErrorTracker.logError(error, context);
};

export const logWarningToService = (message: string, context?: ErrorContext) => {
  backendErrorTracker.logWarning(message, context);
};

export const logInfoToService = (message: string, context?: ErrorContext) => {
  backendErrorTracker.logInfo(message, context);
};

export const setUserContext = (userId: string | number, userInfo?: Record<string, any>) => {
  backendErrorTracker.setUserContext(userId, userInfo);
};

export const addBreadcrumb = (message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
  backendErrorTracker.addBreadcrumb(message, category, level);
};

/**
 * Express middleware error helper
 */
export const logMiddlewareError = (error: Error, req: any, endpoint: string) => {
  logErrorToService(error, {
    endpoint,
    method: req.method,
    requestId: req.id,
    userId: req.user?.id,
    metadata: {
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  });
};

/**
 * Database error helper
 */
export const logDatabaseError = (error: Error, query: string, params?: any[]) => {
  logErrorToService(error, {
    component: 'Database',
    action: 'query',
    metadata: {
      query: query.substring(0, 200), // Truncate long queries
      paramCount: params?.length || 0
    }
  });
};

/**
 * External API error helper
 */
export const logExternalApiError = (error: Error, service: string, endpoint: string) => {
  logErrorToService(error, {
    component: 'ExternalAPI',
    action: `${service}:${endpoint}`,
    metadata: {
      service,
      endpoint,
      status: (error as any).status,
      response: (error as any).response
    }
  });
};
