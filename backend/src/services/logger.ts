/**
 * Structured logging service for TrustDiner Backend
 * Provides consistent logging format and levels across the application
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogContext {
  userId?: string | number;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const baseLog = {
      timestamp,
      level,
      message,
      environment: process.env.NODE_ENV || 'development',
      service: 'trustdiner-backend',
    };

    if (context) {
      Object.assign(baseLog, context);
    }

    // In development, use pretty formatting
    if (this.isDevelopment) {
      const emoji = this.getEmoji(level);
      const colorCode = this.getColorCode(level);
      const resetCode = '\x1b[0m';
      
      let formattedMessage = `${colorCode}${emoji} [${level.toUpperCase()}]${resetCode} ${message}`;
      
      if (context && Object.keys(context).length > 0) {
        formattedMessage += `\n  ${colorCode}Context:${resetCode} ${JSON.stringify(context, null, 2)}`;
      }
      
      return formattedMessage;
    }

    // In production, use JSON format for log aggregation
    return JSON.stringify(baseLog);
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '❌';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🔍';
      default: return '📝';
    }
  }

  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.INFO: return '\x1b[36m';  // Cyan
      case LogLevel.DEBUG: return '\x1b[90m'; // Gray
      default: return '';
    }
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  // Specialized logging methods
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`${method} ${endpoint}`, {
      ...context,
      method,
      endpoint,
      type: 'api_request',
    });
  }

  apiResponse(method: string, endpoint: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : statusCode >= 300 ? LogLevel.WARN : LogLevel.INFO;
    const logMethod = level === LogLevel.ERROR ? this.error : level === LogLevel.WARN ? this.warn : this.info;
    
    logMethod.call(this, `${method} ${endpoint} - ${statusCode}`, {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
      type: 'api_response',
    });
  }

  databaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug('Database query executed', {
      ...context,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      type: 'database_query',
    });
  }

  databaseError(query: string, error: Error, context?: LogContext): void {
    this.error('Database query failed', {
      ...context,
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      error: error.message,
      stack: error.stack,
      type: 'database_error',
    });
  }

  cacheHit(key: string, context?: LogContext): void {
    this.debug('Cache hit', {
      ...context,
      key,
      type: 'cache_hit',
    });
  }

  cacheMiss(key: string, context?: LogContext): void {
    this.debug('Cache miss', {
      ...context,
      key,
      type: 'cache_miss',
    });
  }

  userAction(userId: string | number, action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      ...context,
      userId,
      action,
      type: 'user_action',
    });
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance: ${metric}`, {
      ...context,
      metric,
      value,
      unit,
      type: 'performance_metric',
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export middleware for Express
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Add request ID to request object for use in other middleware
  req.requestId = requestId;
  
  logger.apiRequest(req.method, req.path, {
    requestId,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    logger.apiResponse(req.method, req.path, res.statusCode, duration, {
      requestId,
    });
    originalEnd.apply(this, args);
  };

  next();
};
