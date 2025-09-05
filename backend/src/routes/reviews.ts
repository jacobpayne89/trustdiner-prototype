import { Router, Request, Response } from 'express';
import { ReviewService } from '../services/reviewService';
import { cacheDelete } from '../services/cache';
// TODO: Re-enable core validation imports once module resolution is fixed
// import { validateReviewCreate, validateReviewUpdate } from '../../../shared/validation/core-schemas';
// Import legacy validation for backward compatibility
import { validateCreateReview, validateUpdateReview } from '../validation/reviewValidation';

const router = Router();

// Utility function for consistent error handling
const handleError = (res: Response, error: any, message: string) => {
  console.error(`❌ ${message}:`, error);
  res.status(500).json({
    error: message,
    message: error instanceof Error ? error.message : 'Unknown error occurred'
  });
};

// Utility function for request validation
const validateRequest = (req: Request, requiredFields: string[]) => {
  const missing = requiredFields.filter(field => !req.body[field]);
  if (missing.length > 0) {
    return `Missing required fields: ${missing.join(', ')}`;
  }
  return null;
};

/**
 * GET /api/establishments/:identifier/reviews
 * 
 * Fetch all reviews for a specific establishment by identifier (UUID, place_id, or ID)
 * Returns review data with user information and allergen scores
 */
router.get('/establishments/:identifier/reviews', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 10 } = req.query;

    console.log(`🔍 Fetching reviews for establishment identifier: ${identifier}`);

    const result = await ReviewService.getEstablishmentReviews(identifier, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      includeChainReviews: true
    });

    console.log(`✅ Found establishment: ${result.establishment.name} (ID: ${result.establishment.id})`);
    console.log(`📊 Found ${result.reviews.length} reviews (page ${result.pagination.page}/${result.pagination.totalPages})`);

    res.json({
      establishment: {
        id: result.establishment.id,
        uuid: result.establishment.uuid || null,
        name: result.establishment.name,
        place_id: null, // No place_id column in establishments table
        chain_id: result.chainInfo?.chain_id || null,
        chain_name: result.chainInfo?.chain_name || null
      },
      reviews: result.reviews,
      pagination: result.pagination
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Establishment not found') {
      return res.status(404).json({ 
        error: 'Establishment not found',
        identifier: req.params.identifier
      });
    }
    handleError(res, error, 'Failed to fetch reviews');
  }
});

/**
 * GET /api/reviews/place/:placeId/user/:userId
 * 
 * Get reviews for a specific place by a specific user
 * Supports both place_id and establishment_id as placeId parameter
 */
router.get('/place/:placeId/user/:userId', async (req: Request, res: Response) => {
  try {
    const { placeId, userId } = req.params;
    
    console.log(`🔍 Fetching reviews for place ${placeId} by user ${userId}...`);
    
    const reviews = await ReviewService.getReviewsByPlaceAndUser(placeId, parseInt(userId));

    console.log(`✅ Found ${reviews.length} reviews for place ${placeId} by user ${userId}`);

    res.json(reviews);
    
  } catch (error) {
    handleError(res, error, 'Failed to fetch user reviews for place');
  }
});

/**
 * GET /api/reviews/establishment/:establishmentId/user/:userId
 * 
 * Get reviews for a specific establishment by a specific user using establishment ID
 * This is the preferred endpoint for internal use
 */
router.get('/establishment/:establishmentId/user/:userId', async (req: Request, res: Response) => {
  try {
    const { establishmentId, userId } = req.params;
    
    console.log(`🔍 Fetching reviews for establishment ${establishmentId} by user ${userId}...`);
    
    const reviews = await ReviewService.getReviewsByEstablishmentAndUser(parseInt(establishmentId), parseInt(userId));

    console.log(`✅ Found ${reviews.length} reviews for establishment ${establishmentId} by user ${userId}`);

    res.json(reviews);
    
  } catch (error) {
    handleError(res, error, 'Failed to fetch user reviews for establishment');
  }
});

/**
 * GET /api/reviews/user/:userId
 * 
 * Get all reviews by a specific user (for profile page)
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }
    
    console.log(`📝 Fetching all reviews for user ${userId}...`);
    
    const reviews = await ReviewService.getAllReviewsByUser(parseInt(userId));

    console.log(`✅ Found ${reviews.length} reviews for user ${userId}`);

    // Format response to match expected frontend format
    res.json({
      success: true,
      message: `Found ${reviews.length} reviews for user`,
      count: reviews.length,
      data: reviews.map(review => ({
        id: review.id,
        user_id: review.user_id,
        venue_id: review.venue_id,
        place_id: review.place_id,
        allergen_scores: review.allergen_scores,
        general_comment: review.general_comment,
        overall_rating: review.overall_rating,
        // would_recommend, separate_preparation_area, staff_allergy_trained, 
        // staff_knowledge_rating, cross_contamination_safety columns removed from current schema
        yes_no_answers: {}, // Column doesn't exist in current schema
        created_at: review.created_at,
        updated_at: review.updated_at,
        establishment: {
          place_id: review.place_id,
          name: review.establishment_name,
          address: review.establishment_address,
          uuid: review.establishment_uuid,
          local_image_url: review.establishment_image
        },
        user: {
          display_name: review.user_display_name,
          avatar_url: review.user_profile_image
        },
        chain: review.chain_name ? {
          name: review.chain_name,
          logoUrl: review.chain_logo_url
        } : null
      }))
    });
    
  } catch (error) {
    handleError(res, error, 'Failed to fetch user reviews');
  }
});

/**
 * GET /api/reviews/:id
 * 
 * Get a specific review by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const review = await ReviewService.getReviewById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(review);
    
  } catch (error) {
    handleError(res, error, 'Failed to fetch review');
  }
});

/**
 * POST /api/reviews
 * 
 * Create a new review
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('📝 Received review submission data:', JSON.stringify(req.body, null, 2));
    
    // Convert userId to number if it's a string
    const bodyWithNumericUserId = {
      ...req.body,
      userId: typeof req.body.userId === 'string' ? parseInt(req.body.userId, 10) : req.body.userId
    };
    
    // Use Zod validation with sanitization
    const validatedData = validateCreateReview(bodyWithNumericUserId);
    console.log('✅ Review creation data validated and sanitized:', validatedData);

    const {
      userId,
      establishmentId,
      placeId,
      allergenScores,
      generalComment,
      generalComments,
      overallRating,
      wouldRecommend,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      yesNoAnswers
    } = validatedData;

    // Normalize comment field (frontend sends generalComments, backend expects generalComment)
    const normalizedGeneralComment = generalComment || generalComments;

    // Rating validation is now handled by Zod schema

    console.log(`📝 Creating review for place ${placeId} by user ${userId}`);

    const review = await ReviewService.createReview({
      userId,
      establishmentId, // Don't convert to int - let the service handle chain IDs
      placeId,
      allergenScores,
      generalComment: normalizedGeneralComment,
      overallRating,
      wouldRecommend,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      yesNoAnswers
    });

    console.log(`✅ Review created successfully: ID ${review.id}`);

    // Clear relevant caches
    cacheDelete(`reviews:place:${placeId}`);
    cacheDelete(`reviews:user:${userId}`);

    res.status(201).json(review);

  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      console.error('❌ Zod validation error:', JSON.stringify((error as any).issues, null, 2));
      return res.status(400).json({
        error: 'Validation failed', 
        details: (error as any).issues 
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('already reviewed')) {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
    }
    handleError(res, error, 'Failed to create review');
  }
});

/**
 * PUT /api/reviews/:id
 * 
 * Update an existing review
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { userId } = req.body; // For permission checking

    console.log('🔧 PUT /api/reviews/:id - Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔧 Review ID from params:', reviewId);
    console.log('🔧 yesNoAnswers in request:', JSON.stringify(req.body.yesNoAnswers, null, 2));

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

        // Use Zod validation with sanitization for updates
    const validatedUpdateData = validateUpdateReview(req.body);
    console.log('✅ Review update data validated and sanitized:', JSON.stringify(validatedUpdateData, null, 2));

    const {
      allergenScores,
      generalComment,
      generalComments,
      overallRating,
      wouldRecommend,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      yesNoAnswers
    } = validatedUpdateData;

    // Normalize comment field (frontend sends generalComments, backend expects generalComment)
    const normalizedGeneralComment = generalComment || generalComments;

    // Rating validation is now handled by Zod schema

    console.log(`📝 Updating review ${reviewId}`);

    const updatedReview = await ReviewService.updateReview(reviewId, {
      allergenScores,
      generalComment: normalizedGeneralComment,
      overallRating,
      wouldRecommend,
      separatePreparationArea,
      staffAllergyTrained,
      staffKnowledgeRating,
      crossContaminationSafety,
      yesNoAnswers
    }, userId);

    console.log(`✅ Review updated successfully: ID ${reviewId}`);

    // Clear relevant caches
    cacheDelete(`reviews:${reviewId}`);
    if (updatedReview.establishment_id) {
      cacheDelete(`reviews:establishment:${updatedReview.establishment_id}`);
    }

    res.json(updatedReview);

  } catch (error) {
    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: (error as any).issues 
      });
    }
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('only update your own')) {
        return res.status(403).json({ error: error.message });
      }
    }
    handleError(res, error, 'Failed to update review');
  }
});

/**
 * DELETE /api/reviews/:id
 * 
 * Delete a review
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { userId } = req.body; // For permission checking

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    console.log(`🗑️ Deleting review ${reviewId}`);

    const deletedReview = await ReviewService.deleteReview(reviewId, userId);

    console.log(`✅ Review deleted successfully: ID ${reviewId}`);

    // Clear relevant caches
    cacheDelete(`reviews:${reviewId}`);

    res.json({ message: 'Review deleted successfully', id: deletedReview.id });

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('only delete your own')) {
        return res.status(403).json({ error: error.message });
      }
    }
    handleError(res, error, 'Failed to delete review');
  }
});

/**
 * GET /api/reviews
 * 
 * Get reviews with filtering and pagination (admin use)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      userId,
      establishmentId,
      placeId,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const result = await ReviewService.getReviews({
      status: status as any,
      userId: userId ? parseInt(userId as string) : undefined,
      establishmentId: establishmentId ? parseInt(establishmentId as string) : undefined,
      placeId: placeId as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });

    res.json(result);

  } catch (error) {
    handleError(res, error, 'Failed to fetch reviews');
  }
});

/**
 * PUT /api/reviews/:id/moderate
 * 
 * Moderate a review (admin only)
 */
router.put('/:id/moderate', async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { status, moderatorId } = req.body;

    if (isNaN(reviewId)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    const validationError = validateRequest(req, ['status', 'moderatorId']);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be either "approved" or "rejected"' 
      });
    }

    console.log(`🛡️ Moderating review ${reviewId} to ${status}`);

    const moderatedReview = await ReviewService.moderateReview(reviewId, status, moderatorId);

    console.log(`✅ Review moderated successfully: ID ${reviewId}`);

    // Clear relevant caches
    cacheDelete(`reviews:${reviewId}`);

    res.json(moderatedReview);
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    handleError(res, error, 'Failed to moderate review');
  }
});

/**
 * GET /api/chains/:chainId/reviews
 * 
 * Fetch all reviews for a specific chain
 * Returns review data from all establishments in the chain
 */
router.get('/chains/:chainId/reviews', async (req: Request, res: Response) => {
  try {
    const chainId = parseInt(req.params.chainId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (isNaN(chainId)) {
      return res.status(400).json({ error: 'Invalid chain ID' });
    }

    console.log(`📋 Fetching reviews for chain ID: ${chainId}, page: ${page}, limit: ${limit}`);

    const result = await ReviewService.getChainReviews(chainId, { page, limit });

    console.log(`✅ Found ${result.reviews.length} reviews for chain ${result.chain.name}`);

    res.json(result);
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Chain not found',
        chainId: req.params.chainId
      });
    }
    handleError(res, error, 'Failed to fetch chain reviews');
  }
});

export default router;
