import { z } from 'zod';
import { CANONICAL_ALLERGENS, CanonicalAllergen } from '../../../shared/constants/allergens';

// Helper function to validate allergen scores - ONLY canonical allergens allowed
const allergenScoresSchema = z.record(z.string(), z.number().min(1).max(5))
  .refine(
    (scores) => {
      // Validate all keys are canonical allergens
      const keys = Object.keys(scores);
      return keys.every(key => CANONICAL_ALLERGENS.includes(key as CanonicalAllergen));
    },
    { message: "Allergen scores can only contain canonical allergen keys: " + CANONICAL_ALLERGENS.join(', ') }
  )
  .refine(
    (scores) => Object.keys(scores).length > 0,
    { message: "Allergen scores cannot be empty - if provided, must contain at least one allergen rating" }
  )
  .optional();

// Helper function to validate yes/no answers
const yesNoAnswersSchema = z.record(z.string(), z.union([z.boolean(), z.null()]))
  .refine(
    (answers) => Object.keys(answers).length > 0,
    { message: "Yes/No answers cannot be empty - if provided, must contain at least one answer" }
  )
  .optional();

// Schema for creating a new review
export const CreateReviewSchema = z.object({
  userId: z.number().int().positive(),
  establishmentId: z.union([z.string(), z.number()]).optional(),
  placeId: z.string().min(1),
  allergenScores: allergenScoresSchema,
  generalComment: z.string().optional(),
  generalComments: z.string().optional(), // Frontend compatibility
  overallRating: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  separatePreparationArea: z.boolean().optional(),
  staffAllergyTrained: z.boolean().optional(),
  staffKnowledgeRating: z.number().min(1).max(5).optional(),
  crossContaminationSafety: z.number().min(1).max(5).optional(),
  yesNoAnswers: yesNoAnswersSchema
});

// Schema for updating a review
export const UpdateReviewSchema = z.object({
  userId: z.number().int().positive().optional(),
  allergenScores: allergenScoresSchema,
  generalComment: z.string().optional(),
  generalComments: z.string().optional(), // Frontend compatibility
  overallRating: z.number().min(1).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  separatePreparationArea: z.boolean().optional(),
  staffAllergyTrained: z.boolean().optional(),
  staffKnowledgeRating: z.number().min(1).max(5).optional(),
  crossContaminationSafety: z.number().min(1).max(5).optional(),
  yesNoAnswers: yesNoAnswersSchema
});

// Validation functions
export const validateCreateReview = (data: any) => {
  return CreateReviewSchema.parse(data);
};

export const validateUpdateReview = (data: any) => {
  return UpdateReviewSchema.parse(data);
};

// Type exports
export type ReviewCreateInput = z.infer<typeof CreateReviewSchema>;
export type ReviewUpdateInput = z.infer<typeof UpdateReviewSchema>;
