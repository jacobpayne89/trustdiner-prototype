# TrustDiner Backend API Documentation

## Overview

The TrustDiner Backend API provides endpoints for managing restaurants, reviews, user authentication, and allergen-safe dining information. All endpoints return JSON responses with a standardized format.

### Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://api.trustdiner.com`

### Response Format

All API responses follow a standardized format:

```json
{
  "success": true,
  "data": {}, // Response data
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "errorId": "abc123def456",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "path": "/api/endpoint",
  "method": "GET"
}
```

## Authentication

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "allergies": ["peanuts", "tree nuts"]
    },
    "token": "jwt.token.here"
  }
}
```

### Register
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "allergies": ["peanuts", "tree nuts"]
}
```

### Logout
```http
POST /api/auth/logout
```

## Establishments

### Get All Establishments
```http
GET /api/establishments
```

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 1000)
- `offset` (optional): Number of results to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "placeId": "ChIJ123abc",
      "name": "Restaurant Name",
      "address": "123 Main St, City",
      "latitude": 51.5074,
      "longitude": -0.1278,
      "rating": 4.5,
      "priceLevel": 2,
      "primaryCategory": "restaurant",
      "cuisine": "italian",
      "reviewCount": 15,
      "averageAllergenScores": {
        "peanuts": 4.2,
        "gluten": 3.8,
        "dairy": 4.5
      },
      "chainName": "Pizza Express",
      "chainSlug": "pizza-express",
      "imageUrl": "/images/establishments/abc123.jpg",
      "createdAt": "2025-01-13T12:00:00.000Z",
      "updatedAt": "2025-01-13T12:00:00.000Z"
    }
  ]
}
```

### Get Single Establishment
```http
GET /api/establishments/:id
```

**Parameters:**
- `id`: Establishment ID (integer)

**Response:** Same format as single establishment in the array above.

### Create Establishment (Deferred Import)
```http
POST /api/establishments/import-deferred
```

**Request Body:**
```json
{
  "placeId": "ChIJ123abc",
  "skipIfExists": true
}
```

## Reviews

### Get Reviews for Establishment
```http
GET /api/reviews/place/:placeId
```

**Parameters:**
- `placeId`: Google Places ID or internal establishment ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 1,
      "venueId": 1,
      "allergenScores": {
        "peanuts": 5,
        "gluten": 4,
        "dairy": 5
      },
      "generalComment": "Great allergen-free options!",
      "separatePreparationArea": true,
      "staffAllergyTrained": true,
      "wouldRecommend": true,
      "staffKnowledgeRating": 5,
      "crossContaminationSafety": 4,
      "overallRating": 5,
      "createdAt": "2025-01-13T12:00:00.000Z",
      "user": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ]
}
```

### Get User's Review for Establishment
```http
GET /api/reviews/place/:placeId/user/:userId
```

**Parameters:**
- `placeId`: Google Places ID or internal establishment ID
- `userId`: User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "venueId": 1,
      "userId": 1,
      "allergenScores": {
        "peanuts": 5,
        "gluten": 4
      },
      "generalComment": "Excellent allergen handling",
      "separatePreparationArea": true,
      "staffAllergyTrained": true,
      "wouldRecommend": true,
      "staffKnowledgeRating": 5,
      "crossContaminationSafety": 4,
      "overallRating": 5,
      "createdAt": "2025-01-13T12:00:00.000Z",
      "updatedAt": "2025-01-13T12:00:00.000Z"
    }
  ]
}
```

### Submit Review
```http
POST /api/reviews
```

**Request Body:**
```json
{
  "placeId": "ChIJ123abc",
  "allergenScores": {
    "peanuts": 5,
    "gluten": 4,
    "dairy": 5
  },
  "generalComment": "Great allergen-free options!",
  "separatePreparationArea": true,
  "staffAllergyTrained": true,
  "wouldRecommend": true,
  "staffKnowledgeRating": 5,
  "crossContaminationSafety": 4,
  "overallRating": 5
}
```

### Update Review
```http
PUT /api/reviews/:id
```

**Parameters:**
- `id`: Review ID

**Request Body:** Same as submit review

## Search

### Search Establishments
```http
GET /api/search
```

**Query Parameters:**
- `q`: Search query (required)
- `lat`: Latitude for location-based search (optional)
- `lng`: Longitude for location-based search (optional)
- `radius`: Search radius in meters (optional, default: 5000)

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "place_id": "ChIJ123abc",
        "name": "Restaurant Name",
        "address": "123 Main St",
        "rating": 4.5,
        "price_level": 2,
        "inDatabase": true,
        "result_type": "database"
      }
    ],
    "metadata": {
      "source": "hybrid",
      "count": 1,
      "breakdown": {
        "database": 1,
        "google_total": 0,
        "google_new": 0
      }
    }
  }
}
```

## Users

### Get User Profile
```http
GET /api/users/:id
```

**Parameters:**
- `id`: User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "allergies": ["peanuts", "tree nuts"],
    "avatarUrl": "/images/avatars/user1.jpg",
    "createdAt": "2025-01-13T12:00:00.000Z"
  }
}
```

### Update User Profile
```http
PUT /api/users/:id
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "allergies": ["peanuts", "tree nuts"]
}
```

### Get User's Reviews
```http
GET /api/users/:id/reviews
```

## Health & Monitoring

### Health Check (Quick)
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600000,
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

### Detailed Health Check
```http
GET /api/health/detailed
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "uptime": 3600000,
  "version": "2.0.0",
  "environment": "development",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 15,
      "metadata": {
        "connectionPool": "active"
      }
    },
    {
      "name": "redis",
      "status": "healthy",
      "responseTime": 5
    }
  ],
  "summary": {
    "healthy": 2,
    "unhealthy": 0,
    "degraded": 0,
    "total": 2
  }
}
```

## File Uploads

### Upload Avatar
```http
POST /api/uploads/avatar
```

**Request:** Multipart form data with file

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "/images/avatars/abc123.jpg",
    "filename": "abc123.jpg"
  }
}
```

### Upload Establishment Image
```http
POST /api/uploads/establishment
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `DATABASE_ERROR` | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | External API unavailable |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Development**: 1000 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (default: 50, max: 100)

**Response Headers:**
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages

## Caching

- API responses are cached for 5 minutes by default
- Cache headers indicate freshness:
  - `Cache-Control`: Cache directives
  - `Last-Modified`: Last modification time
  - `ETag`: Resource version identifier

## WebSocket Events (Future)

*Note: WebSocket support is planned for real-time notifications*

### Events
- `review:created` - New review submitted
- `establishment:updated` - Establishment information updated
- `user:profile_updated` - User profile changed
