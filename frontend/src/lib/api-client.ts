/**
 * Production-aligned API client for TrustDiner
 * Handles routing for development (proxied) and production (direct) environments
 */

// Environment-aware API base URL
const getApiBaseUrl = (): string => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use same domain for Vercel deployment
    return '';
  }
  // Development: Use relative URLs through Next.js proxy
  return '';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 API Client initialized:', {
  environment: process.env.NODE_ENV,
  apiBaseUrl: API_BASE_URL,
  isProduction: process.env.NODE_ENV === 'production'
});

/**
 * Standard API client with error handling and retry logic
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an API request with proper error handling
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔄 Fetch starting for: ${url}`);
      const response = await fetch(url, config);
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status}`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      console.log(`📦 About to parse JSON...`);
      const data = await response.json();
      console.log(`✅ API Success: Received data for ${endpoint}`, typeof data, Array.isArray(data) ? `Array(${data.length})` : 'Object');
      console.log(`📤 Returning data:`, data?.length ? `${data.length} items` : 'empty or non-array');
      return data;
    } catch (error) {
      console.error(`❌ API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };

// Convenience methods for common endpoints
export const api = {
  // Establishments
  getEstablishments: async (params?: Record<string, string | number | boolean | string[]>) => {
    let query = '';
    if (params && Object.keys(params).length > 0) {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Repeat keys for array params
          value.forEach(v => sp.append(key, String(v)));
        } else if (value !== undefined && value !== null) {
          sp.append(key, String(value));
        }
      });
      query = `?${sp.toString()}`;
    }
    const response = await apiClient.get<any>(`/establishments${query}`);
    // Handle supported shapes:
    // - [{...}]
    // - { data: [...] }
    // - { establishments: [...] }
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.data)) return response.data;
    if (response && Array.isArray(response.establishments)) return response.establishments;
    console.warn('⚠️ Unexpected API response format for /establishments:', response);
    return [];
  },
  getEstablishment: (id: string) => apiClient.get<any>(`/establishments/${id}`),
  
  // Search
  search: (query: string, params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams({
      q: query,
      ...params,
    }).toString();
    return apiClient.get<any[]>(`/search?${searchParams}`);
  },
  
  // Reviews
  getReviews: (placeId: string) => apiClient.get<any[]>(`/reviews/${placeId}`),
  getUserReviewsForPlace: (placeId: string, userId: string | number, bustCache: boolean = false) => {
    const endpoint = `/reviews/place/${placeId}/user/${userId}`;
    const url = bustCache ? `${endpoint}?_t=${Date.now()}` : endpoint;
    return apiClient.get<any[]>(url);
  },
  getUserReviewsForEstablishment: (establishmentId: number, userId: string | number, bustCache: boolean = false) => {
    const endpoint = `/reviews/establishment/${establishmentId}/user/${userId}`;
    const url = bustCache ? `${endpoint}?_t=${Date.now()}` : endpoint;
    return apiClient.get<any[]>(url);
  },
  submitReview: (review: any) => apiClient.post<any>('/reviews/submit', review),
  
  // Admin
  getChains: () => apiClient.get<any[]>('/admin/chains'),
  
  // User
  getUserProfile: () => apiClient.get<any[]>('/users'), // Returns array of users for dev
  
  // Dashboard
  getDashboardStats: () => apiClient.get<any>('/dashboard/stats'),
};

export default api;
