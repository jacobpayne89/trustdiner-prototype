// Frontend Authentication Token Management
// Secure token storage and management for API authentication

interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

class TokenManager {
  private static readonly TOKEN_KEY = 'trustdiner_auth_token';
  private static readonly REFRESH_KEY = 'trustdiner_refresh_token';

  // Get authentication token for API calls
  static getAuthToken(): string | null {
    if (typeof window === 'undefined') return null; // SSR safety
    
    try {
      const tokenData = localStorage.getItem(this.TOKEN_KEY);
      if (!tokenData) return null;

      const { token, expiresAt } = JSON.parse(tokenData) as AuthToken;
      
      // Check if token is expired
      if (Date.now() >= expiresAt) {
        this.clearTokens();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      this.clearTokens();
      return null;
    }
  }

  // Store authentication token securely
  static setAuthToken(token: string, expiresIn: number = 24 * 60 * 60 * 1000): void {
    if (typeof window === 'undefined') return; // SSR safety

    const tokenData: AuthToken = {
      token,
      expiresAt: Date.now() + expiresIn
    };

    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  }

  // Clear all authentication tokens
  static clearTokens(): void {
    if (typeof window === 'undefined') return; // SSR safety

    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  // Get development token for local development
  static getDevToken(): string {
    return process.env.NEXT_PUBLIC_DEV_TOKEN || 'trustdiner-dev-token-2024';
  }

  // Get appropriate token based on environment
  static getTokenForEnvironment(): string | null {
    // In development, use dev token for convenience
    if (process.env.NODE_ENV === 'development') {
      return this.getDevToken();
    }
    
    // In production, use stored auth token
    return this.getAuthToken();
  }
}

export default TokenManager;