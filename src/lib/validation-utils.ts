/**
 * Validation utilities for runtime type checking
 * Provides helper functions for safe data handling with fallbacks
 */

import { z } from 'zod';
import {
  PlaceSchema,
  ReviewSchema,
  UserSchema,
  type PlaceValidated,
  type ReviewValidated,
  type UserValidated,
} from '@/types/zod-schemas';

/**
 * Safely validates and transforms a single place object
 * Returns null if validation fails
 */
export function validatePlace(data: unknown): PlaceValidated | null {
  try {
    return PlaceSchema.parse(data);
  } catch (error) {
    // Validation failed - return null silently to avoid console spam
    // The data will still be used via the fallback mechanism
    return null;
  }
}

/**
 * Safely validates and transforms an array of places
 * Filters out invalid places and returns only valid ones
 */
export function validatePlaces(data: unknown[]): PlaceValidated[] {
  if (!Array.isArray(data)) {
    console.warn('🚨 Expected array for places validation, got:', typeof data);
    return [];
  }

  const validPlaces: PlaceValidated[] = [];
  let invalidCount = 0;

  for (const item of data) {
    const validPlace = validatePlace(item);
    if (validPlace) {
      validPlaces.push(validPlace);
    } else {
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    console.log(`📊 Client-side validation: ${validPlaces.length}/${data.length} places passed validation`);
  }

  return validPlaces;
}

/**
 * Safely validates and transforms a single review object
 * Returns null if validation fails
 */
export function validateReview(data: unknown): ReviewValidated | null {
  try {
    return ReviewSchema.parse(data);
  } catch (error) {
    console.warn('🚨 Review validation failed:', error);
    return null;
  }
}

/**
 * Safely validates and transforms an array of reviews
 * Filters out invalid reviews and returns only valid ones
 */
export function validateReviewsArray(data: unknown[]): ReviewValidated[] {
  if (!Array.isArray(data)) {
    console.warn('🚨 Expected array for reviews validation, got:', typeof data);
    return [];
  }

  const validReviews: ReviewValidated[] = [];
  let invalidCount = 0;

  for (const item of data) {
    const validReview = validateReview(item);
    if (validReview) {
      validReviews.push(validReview);
    } else {
      invalidCount++;
    }
  }

  if (invalidCount > 0) {
    console.warn(`🚨 Filtered out ${invalidCount} invalid reviews from ${data.length} total`);
  }

  return validReviews;
}

/**
 * Safely validates and transforms a user object
 * Returns null if validation fails
 */
export function validateUserProfile(data: unknown): UserValidated | null {
  try {
    return UserSchema.parse(data);
  } catch (error) {
    console.warn('🚨 User profile validation failed:', error);
    return null;
  }
}

/**
 * Generic validation helper with custom schema
 */
export function safeValidate<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fallback?: T,
  context?: string
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    const contextStr = context ? ` (${context})` : '';
    console.warn(`🚨 Validation failed${contextStr}:`, error);
    
    if (fallback !== undefined) {
      console.warn(`📋 Using fallback data${contextStr}`);
      return fallback;
    }
    
    return null;
  }
}

/**
 * Validation helper for arrays with filtering
 */
export function safeValidateArray<T>(
  data: unknown[],
  schema: z.ZodSchema<T>,
  context?: string
): T[] {
  if (!Array.isArray(data)) {
    const contextStr = context ? ` for ${context}` : '';
    console.warn(`🚨 Expected array${contextStr}, got:`, typeof data);
    return [];
  }

  const validItems: T[] = [];
  let invalidCount = 0;

  for (const item of data) {
    const validItem = safeValidate(item, schema, undefined, context);
    if (validItem !== null) {
      validItems.push(validItem);
    } else {
      invalidCount++;
    }
  }

  if (invalidCount > 0 && context) {
    console.warn(`🚨 Filtered out ${invalidCount} invalid ${context} from ${data.length} total`);
  }

  return validItems;
}

/**
 * Check if data has required fields for partial validation
 */
export function hasRequiredFields(data: unknown, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;
  return requiredFields.every(field => field in obj && obj[field] !== undefined);
}

/**
 * Partial validation - checks if data has minimum required fields
 * Useful for allowing partial rendering with incomplete data
 */
export function isValidPlacePartial(data: unknown): boolean {
  return hasRequiredFields(data, ['id', 'name', 'placeId']);
}

export function isValidReviewPartial(data: unknown): boolean {
  return hasRequiredFields(data, ['id', 'userId', 'placeId']);
}

export function isValidUserPartial(data: unknown): boolean {
  return hasRequiredFields(data, ['id', 'email', 'displayName']);
}

/**
 * Development-only validation helper that throws in dev but warns in production
 */
export function strictValidate<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    const contextStr = context ? ` (${context})` : '';
    const message = `Strict validation failed${contextStr}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ ${message}:`, error);
      throw new Error(`${message}: ${error}`);
    } else {
      console.warn(`🚨 ${message}:`, error);
      // In production, return the data as-is with a warning
      return data as T;
    }
  }
}
