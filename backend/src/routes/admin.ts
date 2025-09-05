import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAdmin, logAdminActionMiddleware } from '../middleware/adminAuth';
import { AdminService, AdminUtils } from '../services/adminService';
import { getPool } from '../services/database';
import { cacheDelete } from '../services/cache';
import { AWSTrackingService } from '../services/awsTrackingService';

const router = Router();

// Multer storage for chain and establishment assets (local filesystem)
// Save into the same root served by Express: backend/storage
const storageRoot = path.resolve(process.cwd(), 'storage');
const chainsRoot = path.resolve(storageRoot, 'chains');
const featuredRoot = path.resolve(chainsRoot, 'featured');
const establishmentsRoot = path.resolve(storageRoot, 'establishments');

// Ensure directories exist (defensive)
if (!fs.existsSync(storageRoot)) fs.mkdirSync(storageRoot, { recursive: true });
if (!fs.existsSync(chainsRoot)) fs.mkdirSync(chainsRoot, { recursive: true });
if (!fs.existsSync(featuredRoot)) fs.mkdirSync(featuredRoot, { recursive: true });
if (!fs.existsSync(establishmentsRoot)) fs.mkdirSync(establishmentsRoot, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const isFeatured = req.path.includes('/featured');
      const isEstablishment = req.path.includes('/establishments/');
      
      if (isEstablishment) {
        cb(null, establishmentsRoot);
      } else if (isFeatured) {
        cb(null, featuredRoot);
      } else {
        cb(null, chainsRoot);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.png';
      const safeBase = String(req.params.id || 'item').replace(/[^a-zA-Z0-9_-]+/g, '-');
      
      let suffix = 'logo';
      if (req.path.includes('/featured')) suffix = 'featured';
      if (req.path.includes('/establishments/')) suffix = 'image';
      
      const ts = Date.now(); // bust caches by using a unique filename
      cb(null, `${safeBase}-${suffix}-${ts}${ext}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid file type'));
  }
});



// Apply admin authentication to all routes in this router
router.use(requireAdmin);

/**
 * GET /api/admin/dashboard-summary
 * Get live dashboard metrics
 */
router.get('/dashboard-summary', async (req: Request, res: Response) => {
  console.log('📊 Admin: Fetching dashboard summary');
  
  try {
    // Get real data from database
    const pool = getPool();
    
    // Get actual counts from database
    const [establishmentsResult, reviewsResult, usersResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM venues.venues WHERE business_status = $1', ['OPERATIONAL']),
      pool.query('SELECT COUNT(*) FROM reviews.reviews'),
      pool.query('SELECT COUNT(*) FROM users.accounts')
    ]);
    
    // Get real API usage data
    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const apiStats = await APIUsageTracker.getUsageStats();
    
    const summary = {
      totalEstablishments: parseInt(establishmentsResult.rows[0].count),
      totalReviews: parseInt(reviewsResult.rows[0].count),
      totalUsers: parseInt(usersResult.rows[0].count),
      apiCallsToday: apiStats.dailyUsage,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Admin: Dashboard summary compiled with real data:', summary);
    res.json(summary);
  } catch (error) {
    console.error('❌ Admin: Failed to fetch dashboard summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/aws-tracking
 * Get AWS activity and cost tracking data
 */
router.get('/aws-tracking', async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin: Fetching AWS tracking data');
    
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Log access for audit purposes
    await AWSTrackingService.logTrackingAccess(userId, 'VIEW_AWS_DASHBOARD');

    const dashboardData = await AWSTrackingService.getDashboardData();
    
    console.log('✅ Admin: AWS tracking data compiled');
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Admin: Failed to fetch AWS tracking data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AWS tracking data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/aws-costs
 * Get detailed AWS cost data
 */
router.get('/aws-costs', async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin: Fetching AWS cost data');
    
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    await AWSTrackingService.logTrackingAccess(userId, 'VIEW_AWS_COSTS');

    const costData = await AWSTrackingService.getCostData();
    
    console.log('✅ Admin: AWS cost data compiled');
    res.json(costData);
  } catch (error) {
    console.error('❌ Admin: Failed to fetch AWS cost data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AWS cost data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/aws-activity
 * Get AWS activity and monitoring data
 */
router.get('/aws-activity', async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin: Fetching AWS activity data');
    
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    await AWSTrackingService.logTrackingAccess(userId, 'VIEW_AWS_ACTIVITY');

    const activityData = await AWSTrackingService.getActivityData();
    
    console.log('✅ Admin: AWS activity data compiled');
    res.json(activityData);
  } catch (error) {
    console.error('❌ Admin: Failed to fetch AWS activity data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch AWS activity data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/google-usage
 * Get Google API usage statistics
 */
router.get('/google-usage', async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin: Fetching Google API usage');

    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const stats = await APIUsageTracker.getUsageStats();

    const usage = {
      dailyUsage: stats.dailyUsage,
      monthlyUsage: stats.monthlyUsage,
      estimatedCost: stats.monthlyCost,
      dailyCost: stats.dailyCost,
      costPerThousand: 17.00, // Average cost per 1000 requests (weighted average of different API costs)
      usageBreakdown: stats.usageBreakdown,
      lastUpdated: stats.lastUpdated
    };

    console.log('✅ Admin: Google usage data compiled from database');
    res.json(usage);

  } catch (error) {
    handleError(res, error, 'Failed to fetch Google API usage', 'google-usage');
  }
});

/**
 * GET /api/admin/google-usage-billing-cycle
 * Get Google API usage statistics for current billing cycle
 */
router.get('/google-usage-billing-cycle', async (req: Request, res: Response) => {
  try {
    console.log('📊 Admin: Fetching Google API billing cycle usage');

    const { APIUsageTracker } = await import('../services/apiUsageTracker');
    const billingStats = await APIUsageTracker.getBillingCycleUsage();

    const usage = {
      billingCycleUsage: billingStats.billingCycleUsage,
      billingCycleCost: billingStats.billingCycleCost,
      billingCycleStart: billingStats.billingCycleStart,
      billingCycleEnd: billingStats.billingCycleEnd,
      daysInCycle: billingStats.daysInCycle,
      daysRemaining: billingStats.daysRemaining,
      costPerThousand: 17.00, // Average cost per 1000 requests
      usageBreakdown: billingStats.usageBreakdown,
      lastUpdated: billingStats.lastUpdated
    };

    console.log('✅ Admin: Google billing cycle usage data compiled from database');
    res.json(usage);

  } catch (error) {
    handleError(res, error, 'Failed to fetch Google API billing cycle usage', 'google-usage-billing-cycle');
  }
});

/**
 * GET /api/admin/establishments
 * Get establishments for admin management
 */




/**
 * POST /api/admin/assign-chain
 * Assign or unassign a chain to an establishment
 */
router.post('/assign-chain', async (req: Request, res: Response) => {
  try {
    const { establishmentId, chainId } = req.body;

    if (!establishmentId) {
      return res.status(400).json({
        error: 'Missing required field: establishmentId'
      });
    }

    console.log(`📊 Admin: Assigning chain ${chainId} to establishment ${establishmentId}`);

    const pool = getPool();
    // Update the venues table (correct table name)
    await pool.query(
      'UPDATE venues.venues SET chain_id = $1 WHERE id = $2',
      [chainId || null, establishmentId]
    );

    console.log('✅ Admin: Chain assignment updated successfully');
    res.json({
      success: true,
      message: 'Chain assignment updated successfully'
    });

  } catch (error) {
    handleError(res, error, 'Failed to assign chain', 'assign-chain');
  }
});



// Utility functions for consistent error handling
const handleError = (res: Response, error: unknown, defaultMessage: string, context?: string) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  console.error(`❌ Admin${context ? ` ${context}` : ''}: ${defaultMessage}:`, error);
  
  let status = 500;
  if (error instanceof Error) {
    if (errorMessage.includes('not found')) status = 404;
    else if (errorMessage.includes('already exists') || errorMessage.includes('Invalid')) status = 400;
  }
  
  res.status(status).json({
    error: defaultMessage,
    message: errorMessage
  });
};

const validateRequest = (res: Response, validation: { valid: boolean; errors: string[] }) => {
  if (!validation.valid) {
    res.status(400).json({
      error: 'Invalid data',
      message: validation.errors.join(', ')
    });
    return false;
  }
  return true;
};

const handleFileUpload = (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return false;
  }
  return true;
};

/**
 * Admin endpoints for managing chains and system administration
 */

/**
 * Get all restaurant chains
 */
router.get('/chains', async (req: Request, res: Response) => {
  try {
    const chains = await AdminService.getChains();
    res.json(chains);
  } catch (error) {
    handleError(res, error, 'Failed to fetch chains');
  }
});

/**
 * Get chain candidates (establishments that could be grouped into chains)
 */
router.get('/chain-candidates', async (req: Request, res: Response) => {
  try {
    const candidates = await AdminService.getChainCandidates();
    res.json(candidates);
  } catch (error) {
    handleError(res, error, 'Failed to fetch chain candidates');
  }
});

/**
 * Get establishments for admin management with filtering and pagination
 */
router.get('/establishments', async (req: Request, res: Response) => {
  try {
    const filters = {
      search: req.query.search as string,
      unassigned_only: req.query.unassigned_only === 'true',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      filter: req.query.filter as 'all' | 'unassigned' | 'chains' | 'verified' | 'unverified' || 'all',
      sortBy: req.query.sortBy as 'name' | 'rating' | 'updated' || 'name',
      sortOrder: req.query.sortOrder as 'asc' | 'desc' || 'asc'
    };

    const result = await AdminService.getEstablishments(filters);
    res.json({
      establishments: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch establishments');
  }
});

/**
 * Assign establishment to chain
 */
router.post('/establishments/:id/assign-chain', 
  logAdminActionMiddleware('ASSIGN_CHAIN', 'establishment'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { chain_id } = req.body;

    const establishment = await AdminService.assignEstablishmentToChain(
      parseInt(id), 
      chain_id ? parseInt(chain_id) : null
    );

    const action = chain_id ? 'assigned to chain' : 'removed from chain';
    res.json({
      success: true,
      establishment,
      message: `Successfully ${action}`
    });
  } catch (error) {
    handleError(res, error, 'Failed to assign chain');
  }
});

/**
 * Update establishment details
 */
router.put('/establishments/:id',
  logAdminActionMiddleware('UPDATE', 'establishment'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const validation = AdminUtils.validateEstablishmentData(updates);
    if (!validateRequest(res, validation)) return;

    const establishment = await AdminService.updateEstablishment(parseInt(id), updates);
    res.json({ establishment });
  } catch (error) {
    handleError(res, error, 'Failed to update establishment');
  }
});

/**
 * Create a new restaurant chain
 */
router.post('/chains',
  logAdminActionMiddleware('CREATE', 'chain'),
  async (req: Request, res: Response) => {
  try {
    const chainData = req.body;
    const validation = AdminUtils.validateChainData(chainData);
    if (!validateRequest(res, validation)) return;

    const chain = await AdminService.createChain(chainData);
    res.status(201).json(chain);
  } catch (error) {
    handleError(res, error, 'Failed to create chain');
  }
});

/**
 * Update a restaurant chain
 */
router.put('/chains/:id',
  logAdminActionMiddleware('UPDATE', 'chain'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const validation = AdminUtils.validateChainData(updates);
    if (!validateRequest(res, validation)) return;

    const chain = await AdminService.updateChain(id, updates);
    res.json(chain);
  } catch (error) {
    handleError(res, error, 'Failed to update chain');
  }
});

/**
 * Upload chain logo (local file)
 */
router.post('/chains/:id/logo', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!handleFileUpload(req, res)) return;
    
    const publicPath = `/images/chains/${req.file!.filename}`;
    const chain = await AdminService.updateChainLogo(id, publicPath);
    res.json({ success: true, local_logo_path: publicPath, chain });
  } catch (error) {
    handleError(res, error, 'Failed to upload logo');
  }
});

/**
 * Upload chain featured image (used for cards)
 */
router.post('/chains/:id/featured', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!handleFileUpload(req, res)) return;
    
    const publicPath = `/images/chains/featured/${req.file!.filename}`;
    const chain = await AdminService.updateChainFeaturedImage(id, publicPath);
    res.json({ success: true, featured_image_path: publicPath, chain });
  } catch (error) {
    handleError(res, error, 'Failed to upload featured image');
  }
});

/**
 * Delete a restaurant chain
 */
router.delete('/chains/:id',
  logAdminActionMiddleware('DELETE', 'chain'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteChain(id);
    res.json({ 
      success: true, 
      message: `Chain deleted successfully (${result.unassignedCount} establishments unassigned)` 
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete chain');
  }
});

/**
 * Get all reviews for moderation
 */
router.get('/reviews', async (req: Request, res: Response) => {
  try {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      filter: req.query.filter as 'all' | 'flagged' | 'hidden' || 'all',
      user_id: req.query.user_id as string,
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      search: req.query.search as string
    };

    const result = await AdminService.getReviews(filters);
    res.json(result);
  } catch (error) {
    handleError(res, error, 'Failed to fetch reviews');
  }
});

/**
 * Update review moderation status
 */
router.put('/reviews/:id',
  logAdminActionMiddleware('MODERATE', 'review'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_flagged, is_hidden, admin_response } = req.body;

    const review = await AdminService.moderateReview(id, {
      is_flagged,
      is_hidden,
      admin_response
    });
    
    res.json({ review });
  } catch (error) {
    handleError(res, error, 'Failed to moderate review');
  }
});

/**
 * Delete a review
 */
router.delete('/reviews/:id',
  logAdminActionMiddleware('DELETE', 'review'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await AdminService.deleteReview(id);
    res.json({ 
      success: true, 
      message: `Review ${id} deleted successfully` 
    });
  } catch (error) {
    handleError(res, error, 'Failed to delete review');
  }
});

// Note: Duplicate route removed - using the earlier establishment update route with AdminService

/**
 * Upload venue image for establishment
 */
router.post('/establishments/:id/image',
  upload.single('image'),
  logAdminActionMiddleware('UPLOAD_IMAGE', 'establishment'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!handleFileUpload(req, res)) return;

    // Create establishments directory if it doesn't exist
    const establishmentsRoot = path.resolve(process.cwd(), 'storage', 'establishments');
    if (!fs.existsSync(establishmentsRoot)) {
      fs.mkdirSync(establishmentsRoot, { recursive: true });
    }

    // Move file to establishments directory with a proper name
    const ext = path.extname(req.file!.originalname) || '.jpg';
    const newFilename = `${id}-${Date.now()}${ext}`;
    const newPath = path.join(establishmentsRoot, newFilename);
    
    // Move the file
    fs.renameSync(req.file!.path, newPath);
    
    // Update database with new image path
    const imageUrl = `/images/establishments/${newFilename}`;
    
    try {
      const establishment = await AdminService.uploadEstablishmentImage(id, imageUrl);
      res.json({
        success: true,
        imageUrl: imageUrl,
        establishment
      });
    } catch (dbError) {
      // Clean up uploaded file if database update fails
      fs.unlinkSync(newPath);
      throw dbError;
    }

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    handleError(res, error, 'Failed to upload image');
  }
});

/**
 * Get all users for admin management
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    console.log('👥 Admin: Fetching users for management');
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    const pool = getPool();
    
    // Build WHERE clause
    let whereClause = 'WHERE u.is_active = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.display_name ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add pagination parameters
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    params.push(limit, offset);

    const usersQuery = `
      SELECT 
        u.id,
        u.email,
        u.display_name,
        u.first_name,
        u.last_name,
        COALESCE(r.name, 'user') as user_type,
        u.created_at,
        u.updated_at,
        COUNT(ar.id) as review_count
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      LEFT JOIN reviews.allergen_reviews ar ON u.id = ar.user_id
      ${whereClause}
      GROUP BY u.id, u.email, u.display_name, u.first_name, u.last_name, r.name, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users.accounts u
      ${whereClause}
    `;

    const [users, countResult] = await Promise.all([
      pool.query(usersQuery, params),
      pool.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Admin: Retrieved ${users.rows.length} users (${total} total)`);

    res.json({
      users: users.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch users');
  }
});

/**
 * Soft delete a user account
 */
router.delete('/users/:id',
  logAdminActionMiddleware('DELETE', 'user'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Get the admin user ID from the request (you'll need to add this to your auth middleware)
    const adminUserId = 1; // TODO: Get from authenticated admin user
    
    // Soft delete the user directly
    const pool = getPool();
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, email FROM users.accounts WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // For now, just mark as inactive instead of soft delete
    await pool.query(
      'UPDATE users.accounts SET is_active = false WHERE id = $1',
      [userId]
    );
    
    console.log(`✅ Admin: User ${userId} (${userCheck.rows[0].email}) marked as inactive`);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to delete user');
  }
});

/**
 * Restore a soft deleted user account
 */
router.post('/users/:id/restore',
  logAdminActionMiddleware('RESTORE', 'user'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Restore the user directly
    const pool = getPool();
    
    // Check if user exists and is inactive
    const userCheck = await pool.query(
      'SELECT id, email, is_active FROM users.accounts WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (userCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'User is not deleted' });
    }
    
    // Restore the user
    await pool.query(
      'UPDATE users.accounts SET is_active = true WHERE id = $1',
      [userId]
    );
    
    console.log(`✅ Admin: User ${userId} (${userCheck.rows[0].email}) restored successfully`);
    
    res.json({ message: 'User restored successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to restore user');
  }
});

/**
 * Permanently delete user (for admin cleanup of test accounts)
 */
router.delete('/users/:id/permanent',
  logAdminActionMiddleware('PERMANENT_DELETE', 'user'),
  async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const pool = getPool();

    // Check if user exists and get their role
    const userCheck = await pool.query(`
      SELECT u.id, u.email, COALESCE(r.name, 'user') as user_type
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      WHERE u.id = $1
    `, [userId]);

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];

    // Prevent deletion of admin users
    if (user.user_type === 'admin') {
      return res.status(403).json({ error: 'Cannot permanently delete admin users' });
    }

    // Begin transaction for safe deletion
    await pool.query('BEGIN');

    try {
      // Delete related records first (foreign key constraints)
      
      // Delete email verifications (if table exists)
      try {
        await pool.query(
          'DELETE FROM "user".email_verification WHERE user_id = $1',
          [userId]
        );
      } catch (emailVerificationError: any) {
        if (emailVerificationError.code !== '42P01') { // Table doesn't exist
          throw emailVerificationError;
        }
        console.log(`ℹ️ Skipping email_verifications cleanup (table doesn't exist)`);
      }

      // Delete reviews
      await pool.query(
        'DELETE FROM reviews.allergen_reviews WHERE user_id = $1',
        [userId]
      );

      // Finally delete the user account
      await pool.query(
        'DELETE FROM users.accounts WHERE id = $1',
        [userId]
      );

      // Commit transaction
      await pool.query('COMMIT');

      console.log(`🗑️ Admin: User ${userId} (${user.email}) permanently deleted`);

      res.json({ message: 'User permanently deleted successfully' });
    } catch (deleteError) {
      // Rollback on error
      await pool.query('ROLLBACK');
      throw deleteError;
    }
  } catch (error) {
    handleError(res, error, 'Failed to permanently delete user');
  }
});

/**
 * Get deleted users (for restoration)
 */
router.get('/users/deleted', async (req: Request, res: Response) => {
  try {
    console.log('👥 Admin: Fetching deleted users for restoration');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    // Get deleted users directly
    const pool = getPool();
    const offset = (page - 1) * limit;
    
    const deletedUsersQuery = `
      SELECT 
        u.id,
        u.email,
        u.display_name,
        u.first_name,
        u.last_name,
        COALESCE(r.name, 'user') as user_type,
        u.updated_at as deleted_at,
        'Admin' as deleted_by_name,
        1 as days_since_deletion,
        COUNT(ar.id) as review_count
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      LEFT JOIN reviews.allergen_reviews ar ON u.id = ar.user_id
      WHERE u.is_active = false
      GROUP BY u.id, u.email, u.display_name, u.first_name, u.last_name, r.name, u.updated_at
      ORDER BY u.updated_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users.accounts u
      WHERE u.is_active = false
    `;
    
    const [users, countResult] = await Promise.all([
      pool.query(deletedUsersQuery, [limit, offset]),
      pool.query(countQuery)
    ]);
    
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);
    
    console.log(`✅ Admin: Retrieved ${users.rows.length} deleted users (${total} total)`);
    
    res.json({
      users: users.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch deleted users');
  }
});

/**
 * Cleanup expired deleted users (30+ days)
 */
router.post('/users/cleanup-expired',
  logAdminActionMiddleware('CLEANUP', 'expired_users'),
  async (req: Request, res: Response) => {
  try {
    console.log('🧹 Admin: Running cleanup for expired deleted users');
    
    // TODO: Fix TypeScript compilation issue
    // const result = await AdminService.cleanupExpiredDeletedUsers();
    const result = { success: true, deletedCount: 0, message: 'Cleanup temporarily disabled' };
    
    if (result.success) {
      res.json({ 
        message: result.message,
        deletedCount: result.deletedCount
      });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    handleError(res, error, 'Failed to cleanup expired users');
  }
});

export { router as adminRouter };