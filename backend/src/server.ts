import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables for development only. In production (ECS), rely on process env.
if (process.env.NODE_ENV !== 'production') {
  // In compiled JS, __dirname is dist/backend/src, so we need to go up to backend root
  dotenv.config({ path: path.join(__dirname, '../../../.env') });
  dotenv.config({ path: path.join(__dirname, '../../.env') });
  dotenv.config({ path: path.join(__dirname, '../.env') });
  dotenv.config({ path: path.join(__dirname, '.env') });
}

// Import route handlers
import establishmentsRouter from './routes/establishments';
import prototypeEstablishmentsRouter from './routes/prototype-establishments';
import { usersRouter } from './routes/users';
import reviewsRouter from './routes/reviews';
import { authRouter } from './routes/auth';
// import { migrateRouter } from './routes/migrate'; // Removed - Firebase migration no longer needed
import { debugRouter } from './routes/debug';
import { healthRouter } from './routes/health';
import { searchRouter } from './routes/search';
import placesRouter from './routes/places';
import { dashboardRouter } from './routes/dashboard';
import { adminRouter } from './routes/admin';
import { utilitiesRouter } from './routes/utilities';
import uploadsRouter from './routes/uploads';
import authRefreshRouter from './routes/auth-refresh';
import chainsRouter from './routes/chains';
import { allergensRouter } from './routes/allergens';
import testPhotoRouter from './routes/test-photo';
import { setupAdminRouter } from './routes/setup-admin';
import { debugAuthRouter } from './routes/debug-auth';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger, logger } from './services/logger';
import { enhancedImageValidation } from './middleware/imageValidation';
import { responseFormatter } from './middleware/responseFormatter';
import { 
  correlationIdMiddleware, 
  distributedTracingMiddleware, 
  userContextMiddleware 
} from './middleware/tracing';

// Import services
import { getPool, testConnection, initializeSchema } from './services/database';
import { initializeCache, cacheHealthCheck } from './services/cache';

// Create Express application
const app = express();

// Trust proxy for rate limiting behind load balancer
app.set('trust proxy', 1);

// TEMP: Fast-path responder to isolate hanging middleware (enable by setting DEBUG_BYPASS=1)
if (process.env.DEBUG_BYPASS === '1') {
  app.all('*', (_req, res) => {
    res.status(200).type('text/plain').send('ok');
  });
}

// Minimal early ping route to verify server responsiveness
app.get('/ping', (_req, res) => {
  res.status(200).send('pong');
});

// Distributed tracing middleware (early in the stack)
app.use(correlationIdMiddleware);
app.use(distributedTracingMiddleware);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://maps.googleapis.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://maps.googleapis.com']
    }
  }
}));

// Environment-aware CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    const isProduction = process.env.NODE_ENV === 'production';

    // Get allowed origins from environment variable
    const envOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean) : [];

    const allowedOrigins = isProduction
      ? envOrigins
      : [
          'http://localhost:3000',
          'http://127.0.0.1:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
          'http://localhost:3002',
          'http://127.0.0.1:3002',
          'http://localhost:3003',
          'http://127.0.0.1:3003',
          'http://localhost:9005',
          'http://127.0.0.1:9005',
          ...envOrigins
        ];

    const isAllowed = allowedOrigins.includes(origin);
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours for preflight cache
};

// RESTORED: Proper CORS configuration with fixed allowed origins
app.use(cors(corsOptions));

// Rate limiting configuration from environment variables
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const rateLimitMaxProd = parseInt(process.env.RATE_LIMIT_MAX_PROD || '100');
const rateLimitMaxDev = parseInt(process.env.RATE_LIMIT_MAX_DEV || '100000'); // Very high for dev

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: process.env.NODE_ENV === 'production' ? rateLimitMaxProd : rateLimitMaxDev,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: `${Math.ceil(rateLimitWindowMs / 60000)} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting entirely in development
  skip: (req) => process.env.NODE_ENV !== 'production'
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Compression middleware
app.use(compression());

// Logging and response formatting
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
  app.use(requestLogger);
  app.use(responseFormatter);
} else {
  // Minimal middleware in development to avoid interference while debugging
  app.use(morgan('dev'));
  // Dev mode: skipping requestLogger and responseFormatter
}

// Static file serving for images with CORS headers and validation
// Updated to serve from storage/uploads to match actual file locations
const imagesPath = path.join(process.cwd(), 'storage', 'uploads');

// Custom image serving with fallbacks
app.get('/images/*', 
  // CORS headers for images
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  // Enhanced image validation with SVG fallbacks
  enhancedImageValidation
);

// API Routes - Order matters! Specific routes before catch-all routes
app.use('/api/chains', chainsRouter); // Must be before reviews router due to /:id route
app.use('/api', allergensRouter); // Allergens endpoint
// API routes - use prototype routes when in prototype mode
if (process.env.PROTOTYPE_MODE === 'true') {
  app.use('/api/establishments', prototypeEstablishmentsRouter);
  console.log('🎯 Using prototype establishments router');
} else {
  app.use('/api/establishments', establishmentsRouter);
}
app.use('/api/users', usersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/auth', authRouter);
app.use('/api/setup-admin', setupAdminRouter); // One-time admin setup endpoint
app.use('/api/debug-auth', debugAuthRouter); // Debug auth issues
// app.use('/api/migrate', migrateRouter); // Removed - Firebase migration no longer needed
app.use('/api/debug', debugRouter);
app.use('/api/search', searchRouter);
app.use('/api/places', placesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api', utilitiesRouter);
app.use('/api', testPhotoRouter); // Test photo conversion endpoint
app.use('/api/health', healthRouter); // API health endpoint for frontend
app.use('/api', reviewsRouter); // For /api/establishments/:uuid/reviews - MUST be last due to /:id route
app.use('/health', healthRouter); // Legacy health endpoint
app.use('/api', authRefreshRouter);

// Legacy endpoints for compatibility
app.post('/api/populate', async (req, res) => {
  // Redirect to establishments populate endpoint
  res.redirect(307, '/api/establishments/populate');
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>TrustDiner API</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
          .container { max-width: 600px; margin: 0 auto; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .method { font-weight: bold; color: #0066cc; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🍽️ TrustDiner API</h1>
            <p>Express.js backend server for TrustDiner</p>
            <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
            <p><strong>Version:</strong> 2.0.0</p>
            
            <h2>Available Endpoints:</h2>
            <div class="endpoint">
                <span class="method">GET</span> <a href="/api/establishments">/api/establishments</a> - Get all venues
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <a href="/api/users">/api/users</a> - Get all users
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <a href="/api/reviews">/api/reviews</a> - Get all reviews
            </div>
            <div class="endpoint">
                <span class="method">GET</span> <a href="/health">/health</a> - Health check
            </div>
            
            <h3>Development Endpoints:</h3>
            <div class="endpoint">
                <span class="method">POST</span> /api/debug/clear-venues - Clear all venues (dev only)
            </div>
            <div class="endpoint">
                <span class="method">POST</span> /api/migrate/places - Migrate places data
            </div>
            <div class="endpoint">
                <span class="method">POST</span> /api/populate - Populate with sample data
            </div>
        </div>
    </body>
    </html>
  `);
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  const PORT = process.env.PORT || 3001;
  
  try {
    // Initialize database
    getPool();
    await testConnection();
    
      // Skip schema initialization for now - use existing data
    
    // Initialize cache
    initializeCache();
    const cacheHealth = await cacheHealthCheck();
    
    // Start server
    const server = app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🚀 TrustDiner API Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API URL: http://localhost:${PORT}`);
        console.log(`💾 Database: Connected`);
        console.log(`📊 Cache: ${cacheHealth.status}`);
        console.log('🎯 Ready to serve requests!');
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
const serverPromise = startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  const server = await serverPromise;
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  const server = await serverPromise;
  server.close(() => {
    console.log('Process terminated');
  });
});

export default app;