// Input Validation and Sanitization for TrustDiner
// Protects against XSS, injection attacks, and malformed data

import DOMPurify from 'isomorphic-dompurify';

// Validation rules
export const ValidationRules = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  placeId: /^ChIJ[a-zA-Z0-9_-]{15,}[AQgw]?$/,  // More flexible: 15+ chars, optional ending
  allergenName: /^[a-zA-Z\s-]{2,20}$/,
  searchQuery: /^[\w\s\-&',\.()]{1,100}$/,
  reviewComment: /^[\w\s\-&',\.()!?]{0,500}$/,
  userName: /^[\w\s\-'\.]{2,50}$/,
  phoneNumber: /^\+?[\d\s\-()]{7,20}$/,
} as const;

// Error messages
export const ValidationErrors = {
  required: 'This field is required',
  invalidEmail: 'Please enter a valid email address',
  weakPassword: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  invalidPlaceId: 'Invalid place identifier',
  invalidAllergen: 'Invalid allergen name',
  searchTooShort: 'Search query must be at least 1 character',
  searchTooLong: 'Search query must be less than 100 characters',
  commentTooLong: 'Comment must be less than 500 characters',
  invalidName: 'Name contains invalid characters',
  invalidPhone: 'Please enter a valid phone number',
  suspiciousContent: 'Content contains potentially harmful elements',
} as const;

// Sanitization functions
export class InputSanitizer {
  // Sanitize HTML content to prevent XSS
  static sanitizeHTML(input: string): string {
    if (!input) return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true, // Keep text content
    });
  }

  // Sanitize text input (remove potential script tags, etc.)
  static sanitizeText(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '')                                          // Remove javascript: URLs
      .replace(/on\w+\s*=/gi, '')                                           // Remove event handlers
      .replace(/eval\s*\(/gi, '')                                           // Remove eval calls
      .replace(/expression\s*\(/gi, '')                                     // Remove CSS expressions
      .trim();
  }

  // Sanitize search queries
  static sanitizeSearchQuery(query: string): string {
    if (!query) return '';
    
    return query
      .replace(/[<>\"']/g, '')  // Remove potential HTML/script chars
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
      .substring(0, 100);       // Limit length
  }

  // Sanitize review comments
  static sanitizeComment(comment: string): string {
    if (!comment) return '';
    
    const sanitized = this.sanitizeText(comment);
    return sanitized.substring(0, 500); // Limit to 500 chars
  }

  // Sanitize user names
  static sanitizeName(name: string): string {
    if (!name) return '';
    
    return name
      .replace(/[<>\"'&]/g, '') // Remove HTML special chars
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
      .substring(0, 50);        // Limit length
  }

  // Sanitize email addresses
  static sanitizeEmail(email: string): string {
    if (!email) return '';
    
    return email
      .toLowerCase()
      .trim()
      .replace(/[<>\"']/g, '');
  }
}

// Validation functions
export class InputValidator {
  // Validate email format
  static isValidEmail(email: string): boolean {
    return ValidationRules.email.test(email);
  }

  // Validate password strength
  static isValidPassword(password: string): boolean {
    return ValidationRules.password.test(password);
  }

  // Validate Google Place ID format
  static isValidPlaceId(placeId: string): boolean {
    return ValidationRules.placeId.test(placeId);
  }

  // Validate allergen name
  static isValidAllergenName(allergen: string): boolean {
    return ValidationRules.allergenName.test(allergen);
  }

  // Validate search query
  static isValidSearchQuery(query: string): boolean {
    if (!query || query.length < 1) return false;
    if (query.length > 100) return false;
    return ValidationRules.searchQuery.test(query);
  }

  // Validate review comment
  static isValidComment(comment: string): boolean {
    if (!comment) return true; // Comments are optional
    if (comment.length > 500) return false;
    return ValidationRules.reviewComment.test(comment);
  }

  // Validate user name
  static isValidName(name: string): boolean {
    if (!name || name.length < 2) return false;
    return ValidationRules.userName.test(name);
  }

  // Check for suspicious content patterns
  static containsSuspiciousContent(input: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  // Comprehensive validation for form inputs
  static validateFormInput(
    input: string,
    type: keyof typeof ValidationRules,
    required = false
  ): { isValid: boolean; error?: string; sanitized: string } {
    // Handle empty inputs
    if (!input || input.trim() === '') {
      if (required) {
        return { isValid: false, error: ValidationErrors.required, sanitized: '' };
      }
      return { isValid: true, sanitized: '' };
    }

    // Check for suspicious content first
    if (this.containsSuspiciousContent(input)) {
      return { 
        isValid: false, 
        error: ValidationErrors.suspiciousContent, 
        sanitized: InputSanitizer.sanitizeText(input) 
      };
    }

    // Sanitize based on type
    let sanitized: string;
    switch (type) {
      case 'email':
        sanitized = InputSanitizer.sanitizeEmail(input);
        break;
      case 'searchQuery':
        sanitized = InputSanitizer.sanitizeSearchQuery(input);
        break;
      case 'reviewComment':
        sanitized = InputSanitizer.sanitizeComment(input);
        break;
      case 'userName':
        sanitized = InputSanitizer.sanitizeName(input);
        break;
      default:
        sanitized = InputSanitizer.sanitizeText(input);
    }

    // Validate based on type
    let isValid = false;
    let error: string | undefined;

    switch (type) {
      case 'email':
        isValid = this.isValidEmail(sanitized);
        error = isValid ? undefined : ValidationErrors.invalidEmail;
        break;
      case 'password':
        isValid = this.isValidPassword(input); // Don't sanitize passwords
        error = isValid ? undefined : ValidationErrors.weakPassword;
        sanitized = input; // Return original password
        break;
      case 'placeId':
        isValid = this.isValidPlaceId(sanitized);
        error = isValid ? undefined : ValidationErrors.invalidPlaceId;
        break;
      case 'allergenName':
        isValid = this.isValidAllergenName(sanitized);
        error = isValid ? undefined : ValidationErrors.invalidAllergen;
        break;
      case 'searchQuery':
        isValid = this.isValidSearchQuery(sanitized);
        error = isValid ? undefined : (sanitized.length < 1 ? ValidationErrors.searchTooShort : ValidationErrors.searchTooLong);
        break;
      case 'reviewComment':
        isValid = this.isValidComment(sanitized);
        error = isValid ? undefined : ValidationErrors.commentTooLong;
        break;
      case 'userName':
        isValid = this.isValidName(sanitized);
        error = isValid ? undefined : ValidationErrors.invalidName;
        break;
      default:
        isValid = true; // Default to valid for unknown types
    }

    return { isValid, error, sanitized };
  }
}

// Rate limiting for validation (prevent brute force validation attacks)
const validationAttempts = new Map<string, { count: number; resetTime: number }>();

export function validateWithRateLimit(
  clientId: string,
  input: string,
  type: keyof typeof ValidationRules,
  required = false
): { isValid: boolean; error?: string; sanitized: string; rateLimited?: boolean } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxAttempts = 100;    // 100 validation attempts per minute

  // Clean up old entries
  if (validationAttempts.has(clientId)) {
    const record = validationAttempts.get(clientId)!;
    if (record.resetTime <= now) {
      validationAttempts.delete(clientId);
    }
  }

  // Check rate limit
  const record = validationAttempts.get(clientId) || { count: 0, resetTime: now + windowMs };
  if (record.count >= maxAttempts) {
    return {
      isValid: false,
      error: 'Too many validation attempts. Please try again later.',
      sanitized: '',
      rateLimited: true
    };
  }

  // Increment counter
  record.count++;
  validationAttempts.set(clientId, record);

  // Perform validation
  return InputValidator.validateFormInput(input, type, required);
}

console.log('🛡️ Input validation and sanitization initialized'); 