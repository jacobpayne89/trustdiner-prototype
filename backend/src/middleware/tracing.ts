/**
 * Distributed Tracing Middleware
 * 
 * Implements correlation IDs and request tracing across the TrustDiner backend.
 * Supports both X-Ray and OpenTelemetry for comprehensive observability.
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../services/logger';

// Extend Express Request interface to include tracing context
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      traceId?: string;
      spanId?: string;
      startTime: number;
      traceContext?: TraceContext;
    }
  }
}

export interface TraceContext {
  correlationId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId?: string | number;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip: string;
  startTime: number;
  metadata?: Record<string, any>;
}

/**
 * X-Ray integration (AWS native tracing)
 */
class XRayTracer {
  private initialized = false;

  constructor() {
    try {
      if (process.env.AWS_XRAY_TRACING_NAME || process.env.NODE_ENV === 'production') {
        // Dynamic import to avoid issues when X-Ray is not available
        const AWSXRay = require('aws-xray-sdk-core');
        
        // Configure X-Ray
        AWSXRay.config([
          AWSXRay.plugins.ECSPlugin,
          AWSXRay.plugins.EC2Plugin,
        ]);
        
        // Set service name
        AWSXRay.middleware.setSamplingRules({
          version: 2,
          default: {
            fixed_target: process.env.NODE_ENV === 'production' ? 1 : 2,
            rate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          },
        });
        
        this.initialized = true;
        logger.info('X-Ray tracing initialized');
      }
    } catch (error) {
      logger.warn('X-Ray initialization failed, using fallback tracing:', error);
    }
  }

  createSegment(name: string, traceContext: TraceContext) {
    if (!this.initialized) return null;

    try {
      const AWSXRay = require('aws-xray-sdk-core');
      const segment = new AWSXRay.Segment(name);
      
      // Add metadata
      segment.addMetadata('http', {
        method: traceContext.method,
        url: traceContext.endpoint,
        user_agent: traceContext.userAgent,
        remote_addr: traceContext.ip,
      });
      
      if (traceContext.userId) {
        segment.setUser(traceContext.userId.toString());
      }
      
      segment.addAnnotation('correlationId', traceContext.correlationId);
      segment.addAnnotation('endpoint', traceContext.endpoint);
      segment.addAnnotation('method', traceContext.method);
      
      return segment;
    } catch (error) {
      logger.error('X-Ray segment creation failed:', error);
      return null;
    }
  }

  closeSegment(segment: any, statusCode: number, error?: Error) {
    if (!segment) return;

    try {
      if (error) {
        segment.addError(error);
      }
      
      segment.http = {
        response: {
          status: statusCode,
        },
      };
      
      segment.close();
    } catch (err) {
      logger.error('X-Ray segment close failed:', err);
    }
  }
}

/**
 * OpenTelemetry integration (vendor-neutral tracing)
 */
class OpenTelemetryTracer {
  private tracer: any = null;
  private initialized = false;

  constructor() {
    try {
      if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT || process.env.ENABLE_OTEL === 'true') {
        // Dynamic import for OpenTelemetry
        const { trace } = require('@opentelemetry/api');
        const { NodeSDK } = require('@opentelemetry/sdk-node');
        const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
        const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');
        
        // Configure SDK
        const sdk = new NodeSDK({
          traceExporter: new OTLPTraceExporter({
            url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
          }),
          instrumentations: [getNodeAutoInstrumentations()],
          serviceName: 'trustdiner-backend',
          serviceVersion: process.env.npm_package_version || '1.0.0',
        });
        
        sdk.start();
        this.tracer = trace.getTracer('trustdiner-backend');
        this.initialized = true;
        
        logger.info('OpenTelemetry tracing initialized');
      }
    } catch (error) {
      logger.warn('OpenTelemetry initialization failed, using fallback tracing:', error);
    }
  }

  createSpan(name: string, traceContext: TraceContext) {
    if (!this.initialized || !this.tracer) return null;

    try {
      const span = this.tracer.startSpan(name, {
        attributes: {
          'http.method': traceContext.method,
          'http.url': traceContext.endpoint,
          'http.user_agent': traceContext.userAgent || '',
          'net.peer.ip': traceContext.ip,
          'correlation.id': traceContext.correlationId,
          'user.id': traceContext.userId?.toString() || '',
        },
      });
      
      return span;
    } catch (error) {
      logger.error('OpenTelemetry span creation failed:', error);
      return null;
    }
  }

  closeSpan(span: any, statusCode: number, error?: Error) {
    if (!span) return;

    try {
      span.setAttributes({
        'http.status_code': statusCode,
      });
      
      if (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message }); // ERROR
      } else {
        span.setStatus({ code: 1 }); // OK
      }
      
      span.end();
    } catch (err) {
      logger.error('OpenTelemetry span close failed:', err);
    }
  }
}

// Initialize tracers
const xrayTracer = new XRayTracer();
const otelTracer = new OpenTelemetryTracer();

/**
 * Correlation ID middleware - adds correlation IDs to all requests
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Generate or extract correlation ID
  req.correlationId = 
    req.headers['x-correlation-id'] as string ||
    req.headers['x-request-id'] as string ||
    req.headers['x-trace-id'] as string ||
    uuidv4();

  // Set response headers
  res.setHeader('X-Correlation-ID', req.correlationId);
  res.setHeader('X-Request-ID', req.correlationId);

  // Record start time
  req.startTime = Date.now();

  // Create trace context
  req.traceContext = {
    correlationId: req.correlationId,
    traceId: req.correlationId, // Use correlation ID as trace ID for simplicity
    spanId: uuidv4(),
    endpoint: req.originalUrl || req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    startTime: req.startTime,
  };

  // Log request start
  logger.info('Request started', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });

  next();
}

/**
 * Distributed tracing middleware - creates spans for request tracking
 */
export function distributedTracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.traceContext) {
    // Fallback if correlation middleware wasn't called
    correlationIdMiddleware(req, res, () => {});
  }

  const spanName = `${req.method} ${req.route?.path || req.path}`;
  
  // Create X-Ray segment
  const xraySegment = xrayTracer.createSegment(spanName, req.traceContext!);
  
  // Create OpenTelemetry span
  const otelSpan = otelTracer.createSpan(spanName, req.traceContext!);

  // Store tracing objects for cleanup
  (req as any)._xraySegment = xraySegment;
  (req as any)._otelSpan = otelSpan;

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(this: Response, ...args: any[]) {
    const duration = Date.now() - req.startTime;
    
    // Update trace context with user info if available
    if ((req as any).user?.id) {
      req.traceContext!.userId = (req as any).user.id;
    }

    // Log request completion
    logger.info('Request completed', {
      correlationId: req.correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.traceContext!.userId,
    });

    // Close tracing spans
    const error = res.statusCode >= 400 ? new Error(`HTTP ${res.statusCode}`) : undefined;
    
    xrayTracer.closeSegment(xraySegment, res.statusCode, error);
    otelTracer.closeSpan(otelSpan, res.statusCode, error);

    // Call original end method
    return originalEnd.apply(this, args);
  };

  next();
}

/**
 * User context middleware - adds user information to trace context
 */
export function userContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // This should be called after authentication middleware
  if (req.traceContext && (req as any).user) {
    req.traceContext.userId = (req as any).user.id;
    
    // Update active spans with user context
    if ((req as any)._xraySegment) {
      try {
        (req as any)._xraySegment.setUser((req as any).user.id.toString());
      } catch (error) {
        // Ignore X-Ray errors
      }
    }
    
    if ((req as any)._otelSpan) {
      try {
        (req as any)._otelSpan.setAttributes({
          'user.id': (req as any).user.id.toString(),
          'user.email': (req as any).user.email || '',
        });
      } catch (error) {
        // Ignore OpenTelemetry errors
      }
    }
  }
  
  next();
}

/**
 * Database query tracing helper
 */
export function traceDbQuery(query: string, params?: any[], correlationId?: string) {
  const queryId = uuidv4();
  const startTime = Date.now();
  
  logger.debug('Database query started', {
    queryId,
    correlationId,
    query: query.substring(0, 200), // Truncate long queries
    paramCount: params?.length || 0,
  });
  
  return {
    queryId,
    finish: (error?: Error, rowCount?: number) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        logger.error('Database query failed', {
          queryId,
          correlationId,
          duration: `${duration}ms`,
          error: error.message,
        });
      } else {
        logger.debug('Database query completed', {
          queryId,
          correlationId,
          duration: `${duration}ms`,
          rowCount: rowCount || 0,
        });
      }
    },
  };
}

/**
 * External API call tracing helper
 */
export function traceExternalCall(service: string, endpoint: string, correlationId?: string) {
  const callId = uuidv4();
  const startTime = Date.now();
  
  logger.debug('External API call started', {
    callId,
    correlationId,
    service,
    endpoint,
  });
  
  return {
    callId,
    finish: (statusCode?: number, error?: Error) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        logger.error('External API call failed', {
          callId,
          correlationId,
          service,
          endpoint,
          duration: `${duration}ms`,
          error: error.message,
        });
      } else {
        logger.info('External API call completed', {
          callId,
          correlationId,
          service,
          endpoint,
          statusCode,
          duration: `${duration}ms`,
        });
      }
    },
  };
}

/**
 * Get correlation ID from request context
 */
export function getCorrelationId(req?: Request): string {
  return req?.correlationId || 'unknown';
}

/**
 * Create child trace context for async operations
 */
export function createChildTraceContext(parent: TraceContext, operation: string): TraceContext {
  return {
    ...parent,
    spanId: uuidv4(),
    parentSpanId: parent.spanId,
    endpoint: `${parent.endpoint}:${operation}`,
    startTime: Date.now(),
  };
}
