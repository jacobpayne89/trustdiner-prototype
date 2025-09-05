import { Pool } from 'pg';
import { getPool } from './database';
import { cacheDelete } from './cache';
import type { Chain, Establishment } from '../../../shared/types/core';

// Additional admin-specific interfaces
export interface ChainWithStats extends Chain {
  location_count?: number;
  avg_rating?: number;
}

export interface EstablishmentWithDetails extends Establishment {
  price_level: number;
  primary_category: string;
  cuisine: string;
  business_status: string;
  local_image_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  chain_id: number | null;
  chain_name: string | null;
  chain_slug: string | null;
  review_count: number;
  avg_allergen_score: number;
}

export interface EstablishmentFilters {
  search?: string;
  unassigned_only?: boolean;
  page?: number;
  limit?: number;
  filter?: 'all' | 'unassigned' | 'chains' | 'verified' | 'unverified';
  sortBy?: 'name' | 'rating' | 'updated';
  sortOrder?: 'asc' | 'desc';
}

export interface ChainCandidate {
  name: string;
  location_count: number;
  categories: string[];
  cuisines: string[];
  avg_rating: number;
  total_reviews: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Admin Service Layer
 * Handles all business logic for admin operations
 */
export class AdminService {
  public static getDbPool(): Pool {
    return getPool();
  }

  /**
   * Get all restaurant chains with location counts and ratings
   */
  static async getChains(): Promise<Chain[]> {
    console.log('🏢 AdminService: Fetching restaurant chains');

    const result = await AdminService.getDbPool().query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.logo_url,
        c.local_logo_path,
        c.featured_image_path,
        c.website_url,
        c.category,
        c.created_at,
        c.updated_at,
        COUNT(e.id) as location_count,
        0 as avg_rating -- TODO: Calculate from reviews
      FROM venues.chains c
      LEFT JOIN venues.venues e ON c.id = e.chain_id
      GROUP BY c.id, c.name, c.slug, c.description, c.logo_url, c.local_logo_path, c.featured_image_path, c.website_url, c.category, c.created_at, c.updated_at
      ORDER BY location_count DESC, c.name ASC
    `);

    console.log(`📊 AdminService: Found ${result.rows.length} restaurant chains`);
    return result.rows;
  }

  /**
   * Get chain candidates (establishments that could be grouped into chains)
   */
  static async getChainCandidates(): Promise<ChainCandidate[]> {
    console.log('🔍 AdminService: Finding chain candidates');

    try {
      // Find establishments with similar names that could be part of chains
      const result = await AdminService.getDbPool().query(`
        SELECT 
          name,
          COUNT(*) as location_count,
          ARRAY_AGG(DISTINCT primary_category) as categories,
          ARRAY_AGG(DISTINCT cuisine) as cuisines,
          0 as avg_rating, -- TODO: Calculate from reviews
          0 as total_reviews -- TODO: Calculate from reviews
        FROM venues.venues 
        GROUP BY LOWER(TRIM(SPLIT_PART(name, ' ', 1)))
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 50
      `);

      console.log(`📊 AdminService: Found ${result.rows.length} potential chain candidates`);
      return result.rows;
    } catch (error) {
      console.error('❌ AdminService: Error finding chain candidates:', error);
      
      // Fallback to simpler query if the advanced query fails
      const fallbackResult = await AdminService.getDbPool().query(`
        SELECT 
          name,
          COUNT(*) as location_count,
          AVG(rating) as avg_rating
        FROM venues.venues 
        GROUP BY name
        HAVING COUNT(*) > 1
        ORDER BY COUNT(*) DESC
        LIMIT 20
      `);

      console.log(`📊 AdminService: Fallback found ${fallbackResult.rows.length} chain candidates`);
      return fallbackResult.rows;
    }
  }

  /**
   * Get establishments with filtering, sorting, and pagination
   */
  static async getEstablishments(filters: EstablishmentFilters): Promise<PaginatedResult<Establishment>> {
    const {
      search,
      unassigned_only = false,
      page = 1,
      limit = 50,
      filter = 'all',
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters;

    console.log('🏪 AdminService: Fetching establishments for management');

    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    
    if (search) {
      const paramIndex = params.length + 1;
      whereClause += ` AND (e.name ILIKE $${paramIndex} OR e.address ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
    }
    
    if (unassigned_only || filter === 'unassigned') {
      whereClause += ' AND e.chain_id IS NULL';
    } else if (filter === 'chains') {
      whereClause += ' AND e.chain_id IS NOT NULL';
    }

    // Build ORDER BY clause
    let orderClause = '';
    if (sortBy === 'name') {
      orderClause = `ORDER BY e.name ${sortOrder.toUpperCase()}`;
    } else if (sortBy === 'rating') {
      orderClause = `ORDER BY e.rating ${sortOrder.toUpperCase()}, e.name ASC`;
    } else if (sortBy === 'updated') {
      orderClause = `ORDER BY e.updated_at ${sortOrder.toUpperCase()}, e.name ASC`;
    } else {
      orderClause = 'ORDER BY CASE WHEN e.chain_id IS NULL THEN 0 ELSE 1 END, e.name ASC';
    }

    const establishmentsQuery = `
      SELECT 
        e.id,
        e.uuid,
        COALESCE(ep.provider_id, e.tags->>'place_id') as place_id, -- Get place_id from external_places or tags
        e.name,
        e.address,
        e.latitude,
        e.longitude,
        NULL as rating, -- Rating calculated from reviews
        NULL as user_ratings_total, -- User ratings calculated from reviews
        e.price_level,
        e.primary_category,
        e.cuisine,
        e.business_status,
        e.primary_image_ref as local_image_url,
        false as verified,
        e.created_at,
        e.updated_at,
        e.chain_id,
        c.name as chain_name,
        c.slug as chain_slug,
        e.phone,
        e.website,
        (
          SELECT COUNT(*)
          FROM reviews.reviews r
          WHERE r.venue_id = e.id
        ) as review_count,
        (
          SELECT AVG(overall_rating)::numeric(3,2)
          FROM reviews.reviews r
          WHERE r.venue_id = e.id
        ) as avg_review_rating
      FROM venues.venues e
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      LEFT JOIN venues.external_places ep ON e.id = ep.venue_id AND ep.provider = 'google_places'
      ${whereClause}
      ${orderClause}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(limit, offset);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM venues.venues e
      LEFT JOIN venues.chains c ON e.chain_id = c.id
      LEFT JOIN venues.external_places ep ON e.id = ep.venue_id AND ep.provider = 'google_places'
      ${whereClause}
    `;

    const [establishmentsResult, countResult] = await Promise.all([
      AdminService.getDbPool().query(establishmentsQuery, params),
      AdminService.getDbPool().query(countQuery, params.slice(0, -2)) // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Convert Google Places photo references to proper URLs
    const establishmentsWithConvertedPhotos = establishmentsResult.rows.map((establishment: any) => {
      if (establishment.local_image_url && establishment.local_image_url.startsWith('ATKogp')) {
        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        
        if (apiKey) {
          const convertedUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${establishment.local_image_url}&key=${apiKey}`;
          return {
            ...establishment,
            local_image_url: convertedUrl
          };
        }
      }
      return establishment;
    });

    console.log(`📊 AdminService: Found ${establishmentsWithConvertedPhotos.length} establishments (${total} total)`);

    return {
      data: establishmentsWithConvertedPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Assign establishment to chain
   */
  static async assignEstablishmentToChain(establishmentId: number, chainId: number | null): Promise<Establishment> {
    console.log(`🔗 AdminService: Assigning establishment ${establishmentId} to chain ${chainId}`);

    const result = await AdminService.getDbPool().query(`
      UPDATE venues.venues 
      SET chain_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, name, chain_id
    `, [chainId || null, establishmentId]);

    if (result.rows.length === 0) {
      throw new Error('Establishment not found');
    }

    const action = chainId ? 'assigned to chain' : 'removed from chain';
    console.log(`✅ AdminService: Establishment ${result.rows[0].name} ${action}`);
    
    return result.rows[0];
  }

  /**
   * Update establishment details
   */
  static async updateEstablishment(id: number, updates: Partial<EstablishmentWithDetails>): Promise<EstablishmentWithDetails> {
    console.log(`🏪 AdminService: Updating establishment ${id}`);

    const { name, address, primary_category, cuisine, chain_id } = updates;
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    
    if (name !== undefined) {
      updateFields.push(`name = $${queryParams.length + 1}`);
      queryParams.push(name);
    }
    
    if (address !== undefined) {
      updateFields.push(`address = $${queryParams.length + 1}`);
      queryParams.push(address);
    }
    
    if (primary_category !== undefined) {
      updateFields.push(`primary_category = $${queryParams.length + 1}`);
      queryParams.push(primary_category);
    }
    
    if (cuisine !== undefined) {
      updateFields.push(`cuisine = $${queryParams.length + 1}`);
      queryParams.push(cuisine);
    }
    
    if (chain_id !== undefined) {
      updateFields.push(`chain_id = $${queryParams.length + 1}`);
      queryParams.push(chain_id === null || chain_id === 0 ? null : chain_id);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated timestamp
    updateFields.push(`updated_at = NOW()`);
    
    const updateQuery = `
      UPDATE venues.venues 
      SET ${updateFields.join(', ')}
      WHERE id = $${queryParams.length + 1}
      RETURNING *
    `;
    
    queryParams.push(id);

    const result = await AdminService.getDbPool().query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      throw new Error('Establishment not found');
    }

    console.log(`✅ AdminService: Updated establishment ${id}`);
    return result.rows[0];
  }

  /**
   * Create a new restaurant chain
   */
  static async createChain(chainData: Omit<Chain, 'id' | 'created_at' | 'updated_at'>): Promise<Chain> {
    const { name, slug, description, logo_url, website_url, category } = chainData;

    if (!name) {
      throw new Error('Chain name is required');
    }

    if (!slug) {
      throw new Error('Chain slug is required');
    }

    console.log(`🏢 AdminService: Creating new restaurant chain: ${name}`);
    
    // Check if slug already exists
    const existingChain = await AdminService.getDbPool().query(`
      SELECT id FROM venues.chains WHERE slug = $1
    `, [slug]);

    if (existingChain.rows.length > 0) {
      throw new Error('A chain with this slug already exists');
    }
    
    const result = await AdminService.getDbPool().query(`
      INSERT INTO venues.chains (name, slug, description, logo_url, website_url, category, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [name, slug, description, logo_url, website_url, category]);

    console.log(`✅ AdminService: Created chain: ${name}`);
    return result.rows[0];
  }

  /**
   * Update a restaurant chain
   */
  static async updateChain(id: string, updates: Partial<Chain>): Promise<Chain> {
    const { name, slug, description, logo_url, website_url, category, local_logo_path, featured_image_path } = updates;

    console.log(`🏢 AdminService: Updating restaurant chain: ${id}`);
    
    // Check if slug already exists (excluding current chain)
    if (slug) {
      const existingChain = await AdminService.getDbPool().query(`
        SELECT id FROM venues.chains WHERE slug = $1 AND id != $2
      `, [slug, id]);

      if (existingChain.rows.length > 0) {
        throw new Error('Another chain with this slug already exists');
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const queryParams: any[] = [];
    
    if (name !== undefined) {
      updateFields.push(`name = $${queryParams.length + 1}`);
      queryParams.push(name);
    }
    
    if (slug !== undefined) {
      updateFields.push(`slug = $${queryParams.length + 1}`);
      queryParams.push(slug);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${queryParams.length + 1}`);
      queryParams.push(description);
    }
    
    if (logo_url !== undefined) {
      updateFields.push(`logo_url = $${queryParams.length + 1}`);
      queryParams.push(logo_url);
    }

    if (local_logo_path !== undefined) {
      updateFields.push(`local_logo_path = $${queryParams.length + 1}`);
      queryParams.push(local_logo_path);
    }

    if (featured_image_path !== undefined) {
      updateFields.push(`featured_image_path = $${queryParams.length + 1}`);
      queryParams.push(featured_image_path);
    }
    
    if (website_url !== undefined) {
      updateFields.push(`website_url = $${queryParams.length + 1}`);
      queryParams.push(website_url);
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    // Add updated timestamp
    updateFields.push(`updated_at = NOW()`);
    
    const updateQuery = `
      UPDATE venues.chains 
      SET ${updateFields.join(', ')}
      WHERE id = $${queryParams.length + 1}
      RETURNING *
    `;
    
    queryParams.push(id);

    const result = await AdminService.getDbPool().query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      throw new Error('Chain not found');
    }

    console.log(`✅ AdminService: Updated chain: ${result.rows[0].name}`);
    
    // Invalidate establishments cache so new chain assets/fields propagate
    await cacheDelete(['api:/api/establishments', 'api:/api/establishments/']);
    
    return result.rows[0];
  }

  /**
   * Delete a restaurant chain
   */
  static async deleteChain(id: string): Promise<{ success: boolean; unassignedCount: number }> {
    console.log(`🏢 AdminService: Deleting restaurant chain: ${id}`);
    
    // First, unassign all establishments from this chain
    const unassignResult = await AdminService.getDbPool().query(`
      UPDATE venues.venues 
      SET chain_id = NULL, updated_at = NOW()
      WHERE chain_id = $1
      RETURNING id
    `, [id]);

    const unassignedCount = unassignResult.rows.length;

    // Then delete the chain
    const result = await AdminService.getDbPool().query(`
      DELETE FROM venues.chains 
      WHERE id = $1
      RETURNING name
    `, [id]);

    if (result.rows.length === 0) {
      throw new Error('Chain not found');
    }

    console.log(`✅ AdminService: Deleted chain: ${result.rows[0].name} (unassigned ${unassignedCount} establishments)`);
    
    // Invalidate cache
    await cacheDelete(['api:/api/establishments', 'api:/api/establishments/']);
    
    return { success: true, unassignedCount };
  }

  /**
   * Update chain logo path (after file upload)
   */
  static async updateChainLogo(id: string, logoPath: string): Promise<Chain> {
    console.log(`🏢 AdminService: Updating chain ${id} logo to ${logoPath}`);

    const result = await AdminService.getDbPool().query(`
      UPDATE venues.chains 
      SET local_logo_path = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [logoPath, id]);

    if (result.rows.length === 0) {
      throw new Error('Chain not found');
    }

    // Invalidate cache
    await cacheDelete(['api:/api/establishments', 'api:/api/establishments/']);
    
    return result.rows[0];
  }

  /**
   * Update chain featured image path (after file upload)
   */
  static async updateChainFeaturedImage(id: string, imagePath: string): Promise<Chain> {
    console.log(`🏢 AdminService: Updating chain ${id} featured image to ${imagePath}`);

    const result = await AdminService.getDbPool().query(`
      UPDATE venues.chains 
      SET featured_image_path = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [imagePath, id]);

    if (result.rows.length === 0) {
      throw new Error('Chain not found');
    }

    // Invalidate cache
    await cacheDelete(['api:/api/establishments', 'api:/api/establishments/']);
    
    return result.rows[0];
  }

  /**
   * Get reviews for moderation with filtering and pagination
   */
  static async getReviews(filters: {
    page?: number;
    limit?: number;
    filter?: 'all' | 'flagged' | 'hidden';
    user_id?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }) {
    console.log('📋 AdminService: Fetching reviews for moderation');

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.filter === 'flagged') {
      conditions.push(`r.is_flagged = true`);
    } else if (filters.filter === 'hidden') {
      conditions.push(`r.is_hidden = true`);
    }

    if (filters.user_id) {
      conditions.push(`r.user_id = $${paramIndex}`);
      params.push(parseInt(filters.user_id));
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`r.created_at >= $${paramIndex}`);
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`r.created_at <= $${paramIndex}`);
      params.push(filters.end_date);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(r.general_comment ILIKE $${paramIndex} OR e.name ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Add pagination parameters
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    params.push(limit, offset);

    const reviewsQuery = `
      SELECT 
        r.*,
        u.email as user_email,
        u.display_name as user_display_name,
        e.name as establishment_name,
        e.address as establishment_address
      FROM reviews.reviews r
      LEFT JOIN users.accounts u ON r.user_id = u.id
      LEFT JOIN venues.venues e ON r.venue_id = e.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews.reviews r
      LEFT JOIN venues.venues e ON r.venue_id = e.id
      ${whereClause}
    `;

    const [reviews, countResult] = await Promise.all([
      AdminService.getDbPool().query(reviewsQuery, params),
      AdminService.getDbPool().query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    return {
      reviews: reviews.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Moderate a review (flag, hide, add admin response)
   */
  static async moderateReview(id: string, updates: {
    is_flagged?: boolean;
    is_hidden?: boolean;
    admin_response?: string;
  }) {
    console.log(`📋 AdminService: Moderating review ${id}`);

    const updateFields: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (updates.is_flagged !== undefined) {
      updateFields.push(`is_flagged = $${paramIndex}`);
      queryParams.push(updates.is_flagged);
      paramIndex++;
    }

    if (updates.is_hidden !== undefined) {
      updateFields.push(`is_hidden = $${paramIndex}`);
      queryParams.push(updates.is_hidden);
      paramIndex++;
    }

    if (updates.admin_response !== undefined) {
      updateFields.push(`admin_response = $${paramIndex}`);
      queryParams.push(updates.admin_response);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);
    
    const updateQuery = `
      UPDATE reviews.reviews 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    queryParams.push(parseInt(id));

    const result = await AdminService.getDbPool().query(updateQuery, queryParams);

    if (result.rows.length === 0) {
      throw new Error('Review not found');
    }

    console.log(`✅ AdminService: Review ${id} moderated successfully`);
    return result.rows[0];
  }

  /**
   * Delete a review
   */
  static async deleteReview(id: string) {
    console.log(`📋 AdminService: Deleting review ${id}`);
    
    const result = await AdminService.getDbPool().query(`
      DELETE FROM reviews.reviews 
      WHERE id = $1
      RETURNING *
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      throw new Error('Review not found');
    }

    console.log(`✅ AdminService: Review ${id} deleted successfully`);
    return result.rows[0];
  }

  /**
   * Upload establishment image
   */
  static async uploadEstablishmentImage(id: string, imageUrl: string) {
    console.log(`🖼️ AdminService: Updating establishment ${id} image to ${imageUrl}`);

    const updateQuery = `
      UPDATE venues.venues
      SET primary_image_ref = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await AdminService.getDbPool().query(updateQuery, [imageUrl, id]);
    
    if (result.rows.length === 0) {
      throw new Error('Establishment not found');
    }

    // Clear cache
    await cacheDelete('api:/api/establishments');
    await cacheDelete('api:/api/establishments/');

    console.log(`✅ AdminService: Updated establishment ${id} image`);
    return result.rows[0];
  }
}

/**
 * Utility functions for admin operations
 */
export class AdminUtils {
  /**
   * Generate a URL-safe slug from a string
   */
  static generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validate chain data
   */
  static validateChainData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Chain name is required');
    }

    if (!data.slug || typeof data.slug !== 'string' || data.slug.trim().length === 0) {
      errors.push('Chain slug is required');
    } else if (!/^[a-z0-9-]+$/.test(data.slug)) {
      errors.push('Chain slug must contain only lowercase letters, numbers, and hyphens');
    }

    if (data.website_url && typeof data.website_url === 'string' && data.website_url.trim().length > 0) {
      try {
        new URL(data.website_url);
      } catch {
        errors.push('Website URL must be a valid URL');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate establishment data
   */
  static validateEstablishmentData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.name !== undefined && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
      errors.push('Establishment name must be a non-empty string');
    }

    if (data.address !== undefined && (typeof data.address !== 'string' || data.address.trim().length === 0)) {
      errors.push('Establishment address must be a non-empty string');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get users for admin management with filtering and pagination
   */
  static async getUsers(filters: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    console.log('👥 AdminService: Fetching users for management');

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE u.deleted_at IS NULL';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.search) {
      whereClause += ` AND (u.email ILIKE $${paramIndex} OR u.display_name ILIKE $${paramIndex} OR u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
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
        u.user_type,
        u.created_at,
        u.updated_at,
        COUNT(r.id) as review_count
      FROM users.accounts u
      LEFT JOIN reviews.allergen_reviews r ON u.id = r.user_id
      ${whereClause}
      GROUP BY u.id, u.email, u.display_name, u.first_name, u.last_name, u.user_type, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users.accounts u
      ${whereClause}
    `;

    const [users, countResult] = await Promise.all([
      AdminService.getDbPool().query(usersQuery, params),
      AdminService.getDbPool().query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`✅ AdminService: Retrieved ${users.rows.length} users (${total} total)`);

    return {
      users: users.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Soft delete a user account
   */
  static async softDeleteUser(userId: number, deletedBy: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ AdminService: Soft deleting user ${userId} by admin ${deletedBy}`);
      
      const pool = AdminService.getDbPool();
      
      // Check if user exists and is not already deleted
      const userCheck = await pool.query(
        'SELECT id, email, deleted_at FROM users.accounts WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      if (userCheck.rows[0].deleted_at) {
        return { success: false, message: 'User is already deleted' };
      }
      
      // Soft delete the user
      await pool.query(
        'UPDATE users.accounts SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE id = $2',
        [deletedBy, userId]
      );
      
      console.log(`✅ AdminService: User ${userId} (${userCheck.rows[0].email}) soft deleted successfully`);
      
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('❌ AdminService: Error soft deleting user:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }

  /**
   * Restore a soft deleted user account
   */
  static async restoreUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔄 AdminService: Restoring user ${userId}`);
      
      const pool = AdminService.getDbPool();
      
      // Check if user exists and is deleted
      const userCheck = await pool.query(
        'SELECT id, email, deleted_at FROM users.accounts WHERE id = $1',
        [userId]
      );
      
      if (userCheck.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      if (!userCheck.rows[0].deleted_at) {
        return { success: false, message: 'User is not deleted' };
      }
      
      // Restore the user
      await pool.query(
        'UPDATE users.accounts SET deleted_at = NULL, deleted_by = NULL WHERE id = $1',
        [userId]
      );
      
      console.log(`✅ AdminService: User ${userId} (${userCheck.rows[0].email}) restored successfully`);
      
      return { success: true, message: 'User restored successfully' };
    } catch (error) {
      console.error('❌ AdminService: Error restoring user:', error);
      return { success: false, message: 'Failed to restore user' };
    }
  }

  /**
   * Get deleted users (for restoration within 30 days)
   */
  static async getDeletedUsers(page: number = 1, limit: number = 50): Promise<any> {
    try {
      console.log(`📋 AdminService: Fetching deleted users (page ${page}, limit ${limit})`);
      
      const offset = (page - 1) * limit;
      const pool = AdminService.getDbPool();
      
      const deletedUsersQuery = `
        SELECT 
          u.id,
          u.email,
          u.display_name,
          u.first_name,
          u.last_name,
          u.user_type,
          u.deleted_at,
          deleter.display_name as deleted_by_name,
          EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - u.deleted_at)) as days_since_deletion,
          COUNT(r.id) as review_count
        FROM users.accounts u
        LEFT JOIN users.accounts deleter ON u.deleted_by = deleter.id
        LEFT JOIN reviews.allergen_reviews r ON u.id = r.user_id
        WHERE u.deleted_at IS NOT NULL 
          AND u.deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        GROUP BY u.id, u.email, u.display_name, u.first_name, u.last_name, u.user_type, u.deleted_at, deleter.display_name
        ORDER BY u.deleted_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users.accounts u
        WHERE u.deleted_at IS NOT NULL 
          AND u.deleted_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `;
      
      const [users, countResult] = await Promise.all([
        pool.query(deletedUsersQuery, [limit, offset]),
        pool.query(countQuery)
      ]);
      
      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);
      
      console.log(`✅ AdminService: Retrieved ${users.rows.length} deleted users (${total} total)`);
      
      return {
        users: users.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('❌ AdminService: Error fetching deleted users:', error);
      throw error;
    }
  }

  /**
   * Permanently delete users that have been soft deleted for more than 30 days
   */
  static async cleanupExpiredDeletedUsers(): Promise<{ success: boolean; deletedCount: number; message: string }> {
    try {
      console.log('🧹 AdminService: Cleaning up expired deleted users (30+ days)');
      
      const pool = AdminService.getDbPool();
      
      // First, get the users that will be permanently deleted for logging
      const expiredUsers = await pool.query(`
        SELECT id, email, deleted_at 
        FROM users.accounts 
        WHERE deleted_at IS NOT NULL 
          AND deleted_at <= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      
      if (expiredUsers.rows.length === 0) {
        console.log('✅ AdminService: No expired deleted users to clean up');
        return { success: true, deletedCount: 0, message: 'No expired users to delete' };
      }
      
      // Permanently delete the users
      const result = await pool.query(`
        DELETE FROM users.accounts 
        WHERE deleted_at IS NOT NULL 
          AND deleted_at <= CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      
      const deletedCount = result.rowCount || 0;
      
      console.log(`✅ AdminService: Permanently deleted ${deletedCount} expired users`);
      expiredUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (deleted ${user.deleted_at})`);
      });
      
      return { 
        success: true, 
        deletedCount, 
        message: `Permanently deleted ${deletedCount} expired users` 
      };
    } catch (error) {
      console.error('❌ AdminService: Error cleaning up expired deleted users:', error);
      return { success: false, deletedCount: 0, message: 'Failed to cleanup expired users' };
    }
  }
}
