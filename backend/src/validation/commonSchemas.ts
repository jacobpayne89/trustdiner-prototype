import { z } from 'zod';
import { CANONICAL_ALLERGENS, type CanonicalAllergen } from '../../../shared/constants/allergens';

/**
 * COMMON VALIDATION SCHEMAS
 * 
 * Centralized Zod schemas for all API endpoints to ensure consistency
 * and proper validation across the entire backend.
 */

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

// Strong password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Display name is required'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  userType: z.enum(['allergy_sufferer', 'parent'], {
    message: 'Please select either "allergy_sufferer" or "parent"'
  }),
  allergies: z.array(z.enum(CANONICAL_ALLERGENS)).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const EmailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const ProfileUpdateSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').optional(),
  allergies: z.array(z.enum(CANONICAL_ALLERGENS)).optional()
});

// =============================================================================
// SEARCH SCHEMAS
// =============================================================================

export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  location: z.string().optional(),
  radius: z.number().min(1).max(50000).optional(), // meters
  type: z.enum(['restaurant', 'establishment']).optional(),
  google_fallback: z.boolean().optional()
});

export const PlaceSearchSchema = z.object({
  place_id: z.string().min(1, 'Place ID is required'),
  fields: z.array(z.string()).optional()
});

// =============================================================================
// UPLOAD SCHEMAS
// =============================================================================

export const ImageUploadSchema = z.object({
  type: z.enum(['avatar', 'establishment', 'chain_logo', 'chain_featured']),
  entity_id: z.number().positive().optional(),
  filename: z.string().min(1, 'Filename is required').optional()
});

export const FileUploadSchema = z.object({
  purpose: z.enum(['profile_avatar', 'establishment_image', 'chain_branding']),
  max_size_mb: z.number().min(0.1).max(10).optional()
});

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserProfileSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').optional(),
  allergies: z.array(z.enum(CANONICAL_ALLERGENS)).optional(),
  dietary_preferences: z.array(z.string()).optional(),
  location: z.string().optional()
});

export const UserPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  privacy_level: z.enum(['public', 'friends', 'private']).optional(),
  default_search_radius: z.number().min(100).max(50000).optional()
});

// =============================================================================
// PLACE/ESTABLISHMENT SCHEMAS
// =============================================================================

export const PlaceDetailsSchema = z.object({
  place_id: z.string().min(1, 'Place ID is required'),
  include_reviews: z.boolean().optional(),
  include_photos: z.boolean().optional(),
  address: z.string().optional(),
  categories: z.array(z.string()).optional(),
  images: z.array(z.string()).optional()
});

export const EstablishmentQuerySchema = z.object({
  search: z.string().optional(),
  chain_id: z.number().positive().optional(),
  has_reviews: z.boolean().optional(),
  min_rating: z.number().min(1).max(5).optional(),
  allergen_safe: z.array(z.enum(CANONICAL_ALLERGENS)).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  sort_by: z.enum(['name', 'rating', 'distance', 'review_count']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional()
});

// =============================================================================
// HEALTH/DEBUG SCHEMAS
// =============================================================================

export const HealthCheckSchema = z.object({
  include_db: z.boolean().optional(),
  include_external: z.boolean().optional()
});

export const DebugQuerySchema = z.object({
  level: z.enum(['info', 'debug', 'error']).optional(),
  component: z.string().optional(),
  limit: z.number().min(1).max(1000).optional()
});

// =============================================================================
// MIGRATION SCHEMAS
// =============================================================================

export const MigrationSchema = z.object({
  action: z.enum(['backup', 'restore', 'migrate', 'rollback']),
  target: z.string().min(1, 'Migration target is required'),
  dry_run: z.boolean().optional(),
  force: z.boolean().optional()
});

// =============================================================================
// UTILITY SCHEMAS
// =============================================================================

export const PaginationSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

export const SortingSchema = z.object({
  sort_by: z.string().min(1).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional()
});

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

export function createValidationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const validation = validateRequest(schema, req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid request data',
        details: validation.errors.issues
      });
    }
    req.validatedBody = validation.data;
    next();
  };
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type EmailVerificationInput = z.infer<typeof EmailVerificationSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;
export type PlaceSearchInput = z.infer<typeof PlaceSearchSchema>;
export type ImageUploadInput = z.infer<typeof ImageUploadSchema>;
export type UserProfileInput = z.infer<typeof UserProfileSchema>;
export type EstablishmentQueryInput = z.infer<typeof EstablishmentQuerySchema>;
export type HealthCheckInput = z.infer<typeof HealthCheckSchema>;
export type MigrationInput = z.infer<typeof MigrationSchema>;
