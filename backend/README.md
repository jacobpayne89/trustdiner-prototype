# TrustDiner Backend

Express.js REST API server for the TrustDiner platform with PostgreSQL database and Google APIs integration.

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with Express.js
- **Database**: PostgreSQL with pg driver
- **APIs**: Google Maps Places API
- **Type Safety**: TypeScript
- **Security**: Helmet.js, CORS, Rate Limiting
- **Caching**: In-memory caching for performance

## 🚀 Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Google Maps API key

### Setup
```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables
Create `.env` file:
```env
DATABASE_URL=postgresql://user:pass@host:5432/trustdiner
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key
GOOGLE_MAPS_API_KEY=your_api_key
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## 📁 Project Structure

```
backend/src/
├── routes/                # API route handlers
│   ├── dashboard.ts       # Usage analytics
│   ├── establishments.ts  # Restaurant data
│   ├── search.ts          # Search functionality
│   ├── places.ts          # Google Places integration
│   ├── admin.ts           # Admin operations
│   └── utilities.ts       # Image and photo services
├── services/              # Business logic and utilities
│   ├── database.ts        # Database operations
│   ├── google-api-limits.ts # API usage tracking
│   ├── rate-limiter.ts    # Request rate limiting
│   ├── search-cache.ts    # Search result caching
│   └── input-validation.ts # Input sanitization
├── middleware/            # Express middleware
└── server.ts              # Main server file
```

## 🔌 API Endpoints

### Core Endpoints
```
GET  /health                    # Health check
GET  /api/establishments        # List restaurants
GET  /api/search?q={query}      # Search restaurants
POST /api/places/details        # Get place details
GET  /api/dashboard             # Usage analytics
```

### Admin Endpoints
```
GET  /api/admin/chains          # Manage restaurant chains
GET  /api/admin/chain-candidates # Review chain candidates
```

### Utility Endpoints
```
GET  /api/discover-image        # Find establishment images
GET  /api/find-image           # Locate specific images
GET  /api/photo-proxy          # Proxy Google Photos API
```

## 🗄️ Database Schema

### Core Tables
- **establishments**: Restaurant data and metadata
- **chains**: Restaurant chain information
- **reviews**: User reviews and allergen ratings
- **chain_detection_candidates**: Automatic chain detection

### Example Queries
```sql
-- Get all establishments in London
SELECT * FROM establishments 
WHERE latitude BETWEEN 51.28 AND 51.7 
AND longitude BETWEEN -0.55 AND 0.35;

-- Get chain restaurants
SELECT e.*, c.name as chain_name 
FROM establishments e 
JOIN chains c ON e.chain_id = c.id;
```

## 🔐 Security Features

### Rate Limiting
```typescript
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit requests per IP
});
```

### Input Validation
```typescript
const validation = InputValidator.validateFormInput(query, 'searchQuery', true);
if (!validation.isValid) {
  return res.status(400).json({ error: validation.error });
}
```

### CORS Configuration
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
```

## 📊 API Usage Tracking

### Google APIs Monitoring
```typescript
const canCall = apiUsageTracker.canMakeCall('PLACE_DETAILS');
if (!canCall.allowed) {
  return res.status(429).json({ 
    error: 'Daily API limit reached',
    quota: apiUsageTracker.getRemainingQuota()
  });
}
```

### Usage Analytics
- Daily API call tracking
- Cost monitoring
- Quota management
- Performance metrics

## 🚀 Deployment

### Railway (Recommended)
```bash
railway login
railway deploy
```

### Environment Variables (Production)
```env
DATABASE_URL=postgresql://production_url
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

### Health Check
```bash
curl https://your-backend.railway.app/health
```

## 🧪 Development Commands

```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # TypeScript checking
```

## 📈 Performance Optimizations

### Caching Strategy
```typescript
// Establishment cache (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Photo cache (1 hour)
const photoCache = new Map();
```

### Database Optimization
- Connection pooling
- Query optimization
- Index usage
- Read replicas for scaling

### API Efficiency
- Response compression
- Request deduplication
- Smart caching strategies
- Batch operations

## 🔍 Monitoring

### Health Checks
- Database connectivity
- API service status
- Memory usage
- Response times

### Logging
```typescript
console.log(`📊 Served ${establishments.length} establishments`);
console.error('Error fetching establishments:', error);
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Test connection
psql $DATABASE_URL

# Check environment variables
echo $DATABASE_URL
```

#### API Rate Limits
```bash
# Check current usage
curl http://localhost:3001/api/dashboard
```

#### CORS Issues
```bash
# Verify FRONTEND_URL in environment
# Check browser network tab for preflight requests
```

---

Built with Express.js and ❤️ for reliable API services. 