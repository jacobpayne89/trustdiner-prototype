import { 
  signAccessToken, 
  signRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken 
} from '../../src/services/jwt';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('JWT Service', () => {
  const mockPayload = {
    sub: 'user123',
    email: 'test@example.com',
    role: 'user'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set required environment variables
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_TTL = '15m';
    process.env.JWT_REFRESH_TTL = '7d';
    process.env.JWT_AUDIENCE = 'trustdiner-api';
    process.env.JWT_ISSUER = 'trustdiner';
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_ACCESS_TTL;
    delete process.env.JWT_REFRESH_TTL;
    delete process.env.JWT_AUDIENCE;
    delete process.env.JWT_ISSUER;
  });

  describe('signAccessToken', () => {
    it('should sign access token with correct parameters', () => {
      const mockToken = 'signed-access-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = signAccessToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-access-secret',
        {
          expiresIn: '15m',
          audience: 'trustdiner-api',
          issuer: 'trustdiner'
        }
      );
    });

    it('should use default values when env vars not set', () => {
      delete process.env.JWT_ACCESS_TTL;
      delete process.env.JWT_AUDIENCE;
      delete process.env.JWT_ISSUER;
      
      const mockToken = 'signed-access-token';
      mockJwt.sign.mockReturnValue(mockToken);

      signAccessToken(mockPayload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-access-secret',
        {
          expiresIn: '15m', // default
          audience: 'trustdiner-api', // default
          issuer: 'trustdiner' // default
        }
      );
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => signAccessToken(mockPayload)).toThrow('JWT_SECRET is required');
    });
  });

  describe('signRefreshToken', () => {
    it('should sign refresh token with correct parameters', () => {
      const mockToken = 'signed-refresh-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = signRefreshToken(mockPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        mockPayload,
        'test-refresh-secret',
        {
          expiresIn: '7d',
          audience: 'trustdiner-api',
          issuer: 'trustdiner'
        }
      );
    });

    it('should throw error when JWT_REFRESH_SECRET is missing', () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => signRefreshToken(mockPayload)).toThrow('JWT_REFRESH_SECRET is required');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', () => {
      const mockToken = 'valid-access-token';
      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = verifyAccessToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'test-access-secret');
    });

    it('should throw error for invalid token', () => {
      const mockToken = 'invalid-token';
      const error = new Error('Invalid token');
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(mockToken)).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      const mockToken = 'expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(mockToken)).toThrow('Token expired');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;

      expect(() => verifyAccessToken('token')).toThrow('JWT_SECRET is required');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      const mockToken = 'valid-refresh-token';
      mockJwt.verify.mockReturnValue(mockPayload as any);

      const result = verifyRefreshToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'test-refresh-secret');
    });

    it('should throw error for invalid refresh token', () => {
      const mockToken = 'invalid-refresh-token';
      const error = new Error('Invalid refresh token');
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyRefreshToken(mockToken)).toThrow('Invalid refresh token');
    });

    it('should throw error when JWT_REFRESH_SECRET is missing', () => {
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => verifyRefreshToken('token')).toThrow('JWT_REFRESH_SECRET is required');
    });
  });

  describe('Token Payload Validation', () => {
    it('should handle numeric user IDs', () => {
      const numericPayload = {
        sub: 12345,
        email: 'test@example.com',
        role: 'admin'
      };
      
      const mockToken = 'signed-token';
      mockJwt.sign.mockReturnValue(mockToken);

      const result = signAccessToken(numericPayload);

      expect(result).toBe(mockToken);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        numericPayload,
        'test-access-secret',
        expect.any(Object)
      );
    });

    it('should handle different user roles', () => {
      const adminPayload = {
        sub: 'admin123',
        email: 'admin@example.com',
        role: 'admin'
      };
      
      const mockToken = 'admin-token';
      mockJwt.sign.mockReturnValue(mockToken);
      mockJwt.verify.mockReturnValue(adminPayload as any);

      const signedToken = signAccessToken(adminPayload);
      const verifiedPayload = verifyAccessToken(signedToken);

      expect(verifiedPayload.role).toBe('admin');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed tokens', () => {
      const malformedToken = 'not.a.valid.jwt.token';
      const error = new Error('Malformed token');
      error.name = 'JsonWebTokenError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(malformedToken)).toThrow('Malformed token');
    });

    it('should handle signature verification failures', () => {
      const tamperedToken = 'tampered.jwt.token';
      const error = new Error('Invalid signature');
      error.name = 'JsonWebTokenError';
      mockJwt.verify.mockImplementation(() => {
        throw error;
      });

      expect(() => verifyAccessToken(tamperedToken)).toThrow('Invalid signature');
    });
  });
});
