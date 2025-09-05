/**
 * Frontend safety utilities for review data handling
 * Prevents accidental data loss during review updates
 */

export interface ReviewPayload {
  establishmentId?: number;
  placeId?: string;
  userId?: number;
  allergenScores?: Record<string, number>;
  generalComment?: string;
  overallRating?: number;
  wouldRecommend?: boolean;
  separatePreparationArea?: boolean;
  staffAllergyTrained?: boolean;
  staffKnowledgeRating?: number;
  crossContaminationSafety?: boolean;
  yesNoAnswers?: Record<string, boolean | null>;
  reviewId?: number;
  [key: string]: any; // Allow additional fields
}

/**
 * Sanitizes review payload to prevent accidental overwrites with empty objects
 * Removes empty objects and empty strings that could clear existing data
 */
export function sanitizeReviewPayload(payload: Partial<ReviewPayload>): Partial<ReviewPayload> {
  const clean = { ...payload };
  
  console.log('🧹 SANITIZING review payload:', payload);
  
  // Remove empty allergenScores object
  if (clean.allergenScores && Object.keys(clean.allergenScores).length === 0) {
    console.log('🧹 REMOVED: Empty allergenScores object');
    delete clean.allergenScores;
  }
  
  // Remove empty yesNoAnswers object
  if (clean.yesNoAnswers && Object.keys(clean.yesNoAnswers).length === 0) {
    console.log('🧹 REMOVED: Empty yesNoAnswers object');
    delete clean.yesNoAnswers;
  } else if (clean.yesNoAnswers) {
    console.log('🧹 KEEPING: yesNoAnswers with content:', clean.yesNoAnswers);
  }
  
  // DEPRECATED: specificAllergenComments field removed
  
  // Remove empty generalComment string
  if (clean.generalComment === '') {
    console.log('🧹 REMOVED: Empty generalComment string');
    delete clean.generalComment;
  } else if (clean.generalComment) {
    console.log('🧹 KEEPING: generalComment with content:', clean.generalComment);
  }
  
  // Remove undefined values to prevent sending undefined to backend
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) {
      console.log(`🧹 REMOVED: Undefined field ${key}`);
      delete clean[key];
    }
  });
  
  console.log('✅ SANITIZED payload:', clean);
  return clean;
}

/**
 * Validates that a review payload has meaningful content
 * Returns true if the payload contains actual data to update
 */
export function hasValidReviewContent(payload: Partial<ReviewPayload>): boolean {
  const sanitized = sanitizeReviewPayload(payload);
  
  console.log('🔍 VALIDATION: Checking review content validity');
  console.log('🔍 Original payload:', payload);
  console.log('🔍 Sanitized payload:', sanitized);
  
  // Check if we have any meaningful content after sanitization
  const meaningfulFields = [
    'allergenScores', 'generalComment',
    'overallRating', 'wouldRecommend', 'separatePreparationArea',
    'staffAllergyTrained', 'staffKnowledgeRating', 'crossContaminationSafety',
    'yesNoAnswers'
  ];
  
  const hasContent = meaningfulFields.some(field => {
    const hasField = sanitized[field] !== undefined;
    console.log(`🔍 Field ${field}: ${hasField ? 'PRESENT' : 'MISSING'} - Value:`, sanitized[field]);
    return hasField;
  });
  
  console.log(`🔍 VALIDATION RESULT: ${hasContent ? 'VALID' : 'INVALID'}`);
  
  if (!hasContent) {
    console.warn('⚠️ WARNING: Review payload has no meaningful content after sanitization');
    console.warn('⚠️ Available fields in sanitized payload:', Object.keys(sanitized));
  }
  
  return hasContent;
}

/**
 * Creates a diff between old and new review data
 * Only includes fields that have actually changed
 */
export function createReviewDiff(
  oldReview: Partial<ReviewPayload>, 
  newReview: Partial<ReviewPayload>
): Partial<ReviewPayload> {
  const diff: Partial<ReviewPayload> = {};
  
  console.log('🔍 DIFFING reviews:', { old: oldReview, new: newReview });
  
  // Check each field for changes
  const fieldsToCheck = [
    'allergenScores', 'generalComment',
    'overallRating', 'wouldRecommend', 'separatePreparationArea',
    'staffAllergyTrained', 'staffKnowledgeRating', 'crossContaminationSafety',
    'yesNoAnswers'
  ];
  
  fieldsToCheck.forEach(field => {
    const oldValue = oldReview[field];
    const newValue = newReview[field];
    
    // Deep comparison for objects
    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        diff[field] = newValue;
        console.log(`📝 CHANGED: ${field}`, { from: oldValue, to: newValue });
      }
    } else if (oldValue !== newValue) {
      diff[field] = newValue;
      console.log(`📝 CHANGED: ${field}`, { from: oldValue, to: newValue });
    }
  });
  
  console.log('✅ DIFF result:', diff);
  return diff;
}

/**
 * Logs a warning when potentially destructive updates are detected
 */
export function logPotentialDataLoss(
  reviewId: number | undefined,
  field: string,
  oldValue: any,
  newValue: any
): void {
  if (oldValue && (!newValue || (typeof newValue === 'object' && Object.keys(newValue).length === 0))) {
    // If the new value is undefined (sanitized out), this is protection working correctly
    if (newValue === undefined) {
      console.log(`🛡️ DATA PROTECTION: Empty ${field} was sanitized out to preserve existing data - Review ID: ${reviewId || 'NEW'}`);
      console.log(`   Existing value preserved:`, oldValue);
    } else {
      console.warn(`🚨 POTENTIAL DATA LOSS DETECTED:`);
      console.warn(`   Review ID: ${reviewId || 'NEW'}`);
      console.warn(`   Field: ${field}`);
      console.warn(`   Old value:`, oldValue);
      console.warn(`   New value:`, newValue);
      console.warn(`   Timestamp: ${new Date().toISOString()}`);
      console.warn(`   This update may clear existing data!`);
    }
  }
}
