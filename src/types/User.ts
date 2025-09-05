// User-related type definitions
import type { User as CoreUser } from "../../../shared/types/core";

// Frontend User type extending the core User with camelCase aliases
export interface User extends CoreUser {
  uid: string; // For backward compatibility
  displayName: string; // Camel case alias for display_name
  firstName?: string; // Camel case alias for first_name
  lastName?: string; // Camel case alias for last_name
  userType: string; // Camel case alias for user_type
}

// User types for profile form
export interface UserType {
  value: string;
  label: string;
  shortLabel: string;
}

// Allergen preference interface
export interface AllergenPreference {
  id: string | number;
  name: string;
  severity?: string;
}

// Profile form data
export interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  allergies: AllergenPreference[];
  userType: string;
  avatarUrl?: string;
}

// User authentication state
export interface AuthState {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
}

// Auth request interfaces - aligned with backend schemas
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}
