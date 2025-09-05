// Test setup for backend
import { config } from 'dotenv'

// Load test environment variables
config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/trustdiner_test'

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment to suppress logs in tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
}
