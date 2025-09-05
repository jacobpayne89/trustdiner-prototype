import { Router, Request, Response } from 'express';
import { query } from '../services/database';

const router = Router();

/**
 * GET /api/users
 * Get all users from the database
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('👥 Fetching users from database...');
    
    const result = await query(`
      SELECT 
        id, email, display_name, first_name, last_name,
        avatar_url, created_at, updated_at, last_login, is_active
      FROM "users".accounts
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    
    console.log(`✅ Retrieved ${result.rows.length} users from database`);
    
    // Transform to frontend format
    const transformedUsers = result.rows.map((user: any) => ({
      id: user.id,
      // firebaseUid: user.firebase_uid, // Removed - legacy field
      email: user.email,
      displayName: user.display_name,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: 'standard', // Default user type since we removed user_type column
      allergies: user.allergies || [],
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      isActive: user.is_active
    }));
    
    res.json(transformedUsers);
    
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user by ID with roles and allergen preferences
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }
    
    console.log(`👤 Fetching user ${id}...`);
    
    // Get user basic info
    const userResult = await query(`
      SELECT 
        id, email, display_name, first_name, last_name,
        avatar_url, created_at, updated_at, last_login, is_active
      FROM users.accounts
      WHERE id = $1 AND is_active = true
    `, [parseInt(id)]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: `No user found with ID ${id}`
      });
    }
    
    const user = userResult.rows[0];
    
    // Get user role
    const roleResult = await query(`
      SELECT r.name as role_name
      FROM users.user_roles ur
      JOIN users.roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1
    `, [parseInt(id)]);
    
    // Get user allergen preferences
    const allergenResult = await query(`
      SELECT a.id, a.name, ap.severity
      FROM users.allergen_preferences ap
      JOIN allergens a ON ap.allergen_id = a.id
      WHERE ap.user_id = $1
    `, [parseInt(id)]);
    
    // Transform to frontend format
    const transformedUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      firstName: user.first_name,
      lastName: user.last_name,
      userType: roleResult.rows.length > 0 ? roleResult.rows[0].role_name : 'user',
      allergies: allergenResult.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        severity: row.severity
      })),
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      isActive: user.is_active
    };
    
    console.log(`✅ Found user: ${user.display_name}`);
    res.json(transformedUser);
    
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      email,
      displayName,
      firstName,
      lastName,
      // firebaseUid, // Removed - legacy field
      userType = 'standard',
      allergies = []
    } = req.body;
    
    // Validate required fields
    if (!email || !displayName) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and display name are required'
      });
    }
    
    console.log(`👤 Creating user: ${displayName} (${email})`);
    
    const result = await query(`
      INSERT INTO users.accounts (
        email, display_name, first_name, last_name
      ) VALUES ($1, $2, $3, $4)
      RETURNING id, email, display_name, created_at
    `, [
      email,
      displayName,
      firstName,
      lastName
    ]);
    
    const newUser = result.rows[0];
    console.log(`✅ Created user with ID: ${newUser.id}`);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.display_name,
        createdAt: newUser.created_at
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user's profile including roles and allergen preferences
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      firstName,
      lastName,
      allergies,
      userType
    } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }
    
    console.log(`👤 Updating user ${id}...`);
    
    // Start transaction for atomic updates
    await query('BEGIN');
    
    try {
      // Update basic profile fields
      const updateFields = [];
      const values = [];
      let paramCount = 1;
      
      if (displayName !== undefined) {
        updateFields.push(`display_name = $${paramCount}`);
        values.push(displayName);
        paramCount++;
      }
      
      if (firstName !== undefined) {
        updateFields.push(`first_name = $${paramCount}`);
        values.push(firstName);
        paramCount++;
      }
      
      if (lastName !== undefined) {
        updateFields.push(`last_name = $${paramCount}`);
        values.push(lastName);
        paramCount++;
      }
      
      let updatedUser = null;
      
      if (updateFields.length > 0) {
        // Add updated_at timestamp
        updateFields.push(`updated_at = NOW()`);
        
        // Add user ID as the last parameter
        values.push(parseInt(id));
        
        const updateQuery = `
          UPDATE users.accounts 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount} AND is_active = true
          RETURNING id, email, display_name, first_name, last_name, updated_at
        `;
        
        console.log('🔄 Executing update query:', updateQuery);
        const result = await query(updateQuery, values);
        
        if (result.rows.length === 0) {
          await query('ROLLBACK');
          return res.status(404).json({
            error: 'User not found',
            message: `No user found with ID ${id}`
          });
        }
        
        updatedUser = result.rows[0];
      }
      
      // Update user role if provided
      if (userType !== undefined) {
        console.log(`🔄 Updating user role to: ${userType}`);
        
        // First, remove existing role
        await query(`
          DELETE FROM users.user_roles WHERE user_id = $1
        `, [parseInt(id)]);
        
        // Then add new role if it's not empty
        if (userType && userType !== '') {
          const roleResult = await query(`
            SELECT id FROM users.roles WHERE name = $1
          `, [userType]);
          
          if (roleResult.rows.length > 0) {
            await query(`
              INSERT INTO users.user_roles (user_id, role_id)
              VALUES ($1, $2)
            `, [parseInt(id), roleResult.rows[0].id]);
          }
        }
      }
      
      // Update allergen preferences if provided
      if (allergies !== undefined && Array.isArray(allergies)) {
        console.log(`🔄 Updating allergen preferences: ${allergies.length} items`);
        
        // First, remove existing allergen preferences
        await query(`
          DELETE FROM users.allergen_preferences WHERE user_id = $1
        `, [parseInt(id)]);
        
        // Then add new allergen preferences
        for (const allergen of allergies) {
          if (allergen.id) {
            // Only add severity if explicitly provided by the user
            if (allergen.severity) {
              await query(`
                INSERT INTO users.allergen_preferences (user_id, allergen_id, severity)
                VALUES ($1, $2, $3)
              `, [parseInt(id), allergen.id, allergen.severity]);
            } else {
              // Insert without severity (NULL value)
              await query(`
                INSERT INTO users.allergen_preferences (user_id, allergen_id)
                VALUES ($1, $2)
              `, [parseInt(id), allergen.id]);
            }
          }
        }
      }
      
      // Commit transaction
      await query('COMMIT');
      
      // Fetch updated user data with roles and allergens
      const finalUserResult = await query(`
        SELECT 
          id, email, display_name, first_name, last_name,
          avatar_url, created_at, updated_at, last_login, is_active
        FROM users.accounts
        WHERE id = $1 AND is_active = true
      `, [parseInt(id)]);
      
      const finalUser = finalUserResult.rows[0];
      
      // Get updated role
      const roleResult = await query(`
        SELECT r.name as role_name
        FROM users.user_roles ur
        JOIN users.roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `, [parseInt(id)]);
      
      // Get updated allergen preferences
      const allergenResult = await query(`
        SELECT a.id, a.name, ap.severity
        FROM users.allergen_preferences ap
        JOIN allergens a ON ap.allergen_id = a.id
        WHERE ap.user_id = $1
      `, [parseInt(id)]);
      
      // Transform to frontend format
      const transformedUser = {
        id: finalUser.id,
        email: finalUser.email,
        displayName: finalUser.display_name,
        firstName: finalUser.first_name,
        lastName: finalUser.last_name,
        userType: roleResult.rows.length > 0 ? roleResult.rows[0].role_name : 'user',
        allergies: allergenResult.rows.map((row: any) => ({
          id: row.id,
          name: row.name,
          severity: row.severity
        })),
        avatarUrl: finalUser.avatar_url,
        createdAt: finalUser.created_at,
        updatedAt: finalUser.updated_at,
        lastLogin: finalUser.last_login,
        isActive: finalUser.is_active
      };
      
      console.log(`✅ Updated user: ${finalUser.display_name}`);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        user: transformedUser
      });
      
    } catch (innerError) {
      await query('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as usersRouter };