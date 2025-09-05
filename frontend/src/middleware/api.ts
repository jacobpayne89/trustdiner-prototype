/**
 * API middleware for request/response interceptors with logging and error handling
 */

// API request logging middleware
export const logApiRequest = (url: string, options: RequestInit = {}) => {
  console.log('🌐 API Request:', {
    method: options.method || 'GET',
    url,
    timestamp: new Date().toISOString(),
    headers: options.headers,
  });
};

// API response logging middleware
export const logApiResponse = (url: string, response: Response, duration: number) => {
  console.log('✅ API Response:', {
    url,
    status: response.status,
    statusText: response.statusText,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
};

// API error logging middleware
export const logApiError = (url: string, error: Error, duration: number) => {
  console.error('❌ API Error:', {
    url,
    error: error.message,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  });
};

// Enhanced fetch with middleware
export const apiRequest = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const startTime = Date.now();
  
  // Add default headers with descriptive context
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Source': 'trustdiner-frontend',
      'X-Request-Timestamp': new Date().toISOString(),
      ...options.headers,
    },
  };

  // Log outgoing request
  logApiRequest(url, enhancedOptions);

  try {
    const response = await fetch(url, enhancedOptions);
    const duration = Date.now() - startTime;
    
    // Log successful response
    logApiResponse(url, response, duration);
    
    // Handle non-200 responses
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiError(url, error as Error, duration);
    throw error;
  }
};

// Typed API response handler
export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Failed to parse API response as JSON:', error);
    throw new Error('Invalid JSON response from API');
  }
};

// Combined API call with full middleware
export const makeApiCall = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  const response = await apiRequest(url, options);
  return handleApiResponse<T>(response);
}; 