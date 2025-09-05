// API-related type definitions

// API Response wrapper
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API Error response
export interface APIError {
  success: false;
  error: string;
  details?: any;
}

// Establishments API response
export interface EstablishmentsResponse {
  establishments: Array<any>; // Will use Place type when imported
  total: number;
  page?: number;
  limit?: number;
}

// Auth API responses
export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    email: string;
    displayName: string;
    firstName?: string;
    lastName?: string;
    userType: string;
    allergies?: string[];
  };
  token?: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  userId?: number;
}

// Reviews API response
export interface ReviewsResponse {
  reviews: Array<any>; // Will use Review type when imported
  total: number;
  page?: number;
  limit?: number;
}

// Google API usage data
export interface GoogleAPIUsage {
  name: string;
  used: number;
  limit: number;
  percentage: number;
  risk: 'low' | 'medium' | 'high';
}

// Dashboard data
export interface DashboardData {
  usage: GoogleAPIUsage[];
  monthlyCost: {
    current: number;
    projected: number;
    limit: number;
  };
}
