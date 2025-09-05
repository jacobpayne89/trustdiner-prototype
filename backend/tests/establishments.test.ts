import request from 'supertest'
import express from 'express'
import { query } from '../src/services/database'

// Mock the database service
jest.mock('../src/services/database', () => ({
  query: jest.fn(),
}))

// Mock Redis cache
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    ping: jest.fn().mockResolvedValue('PONG'),
  }))
})

// Import the route after mocking dependencies
import establishmentsRouter from '../src/routes/establishments'
import { responseFormatter } from '../src/middleware/responseFormatter'

const app = express()
app.use(express.json())
app.use(responseFormatter)
app.use('/api/establishments', establishmentsRouter)

describe('Establishments API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/establishments', () => {
    it('should return establishments successfully', async () => {
      const mockEstablishments = [
        {
          id: 1,
          place_id: 'ChIJ123',
          name: 'Test Restaurant',
          address: '123 Test St',
          latitude: 51.5074,
          longitude: -0.1278,
          rating: 4.5,
        },
      ]

      const mockReviews = [
        {
          venue_id: 1,
          review_count: 5,
          allergen_scores: [{ peanuts: 4, gluten: 5 }],
        },
      ]

      // Mock database queries
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockEstablishments }) // establishments query
        .mockResolvedValueOnce({ rows: mockReviews }) // reviews query

      const response = await request(app).get('/api/establishments')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].name).toBe('Test Restaurant')
      expect(response.body.data[0].reviewCount).toBe(5)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      ;(query as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'))

      const response = await request(app).get('/api/establishments')

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Failed to fetch establishments')
    })

    it('should return empty array when no establishments found', async () => {
      // Mock empty results
      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: [] }) // establishments query
        .mockResolvedValueOnce({ rows: [] }) // reviews query

      const response = await request(app).get('/api/establishments')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual([])
    })

    it('should include review data in response', async () => {
      const mockEstablishments = [
        {
          id: 1,
          place_id: 'ChIJ123',
          name: 'Test Restaurant',
          address: '123 Test St',
          latitude: 51.5074,
          longitude: -0.1278,
          rating: 4.5,
        },
      ]

      const mockReviews = [
        {
          venue_id: 1,
          review_count: 3,
          allergen_scores: [
            { peanuts: 4, gluten: 5 },
            { peanuts: 5, gluten: 4 },
            { peanuts: 3, gluten: 5 },
          ],
        },
      ]

      ;(query as jest.Mock)
        .mockResolvedValueOnce({ rows: mockEstablishments })
        .mockResolvedValueOnce({ rows: mockReviews })

      const response = await request(app).get('/api/establishments')

      expect(response.status).toBe(200)
      expect(response.body.data[0].reviewCount).toBe(3)
      expect(response.body.data[0].averageAllergenScores).toBeDefined()
      expect(response.body.data[0].averageAllergenScores.peanuts).toBeCloseTo(4.0, 1)
      expect(response.body.data[0].averageAllergenScores.gluten).toBeCloseTo(4.7, 1)
    })
  })

  describe('GET /api/establishments/:id', () => {
    it('should return a specific establishment', async () => {
      const mockEstablishment = {
        id: 1,
        place_id: 'ChIJ123',
        name: 'Test Restaurant',
        address: '123 Test St',
        latitude: 51.5074,
        longitude: -0.1278,
        rating: 4.5,
      }

      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [mockEstablishment] })

      const response = await request(app).get('/api/establishments/1')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('Test Restaurant')
    })

    it('should return 404 for non-existent establishment', async () => {
      ;(query as jest.Mock).mockResolvedValueOnce({ rows: [] })

      const response = await request(app).get('/api/establishments/999')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    it('should handle invalid ID parameter', async () => {
      const response = await request(app).get('/api/establishments/invalid-id')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })
})
