import { Router, Request, Response } from 'express';
import { query } from '../services/database';
import bcrypt from 'bcrypt';
import { LoginSchema, RegisterSchema, validateRequest } from '../validation/commonSchemas';
import { signAccessToken, signRefreshToken } from '../services/jwt';

const router = Router();

const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Simple login route without rate limiting for now
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('🔐 Login route called');
    console.log('📋 Request body:', req.body);
    
    const validation = validateRequest(LoginSchema, req.body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.errors.issues);
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.errors.issues
      });
    }

    const { email, password } = validation.data;
    console.log(`🔐 Login attempt for: ${email}`);
    
    console.log('🔍 Querying database for user...');
    const result = await query(`
      SELECT 
        u.id, u.email, u.display_name, u.first_name, u.last_name,
        u.password_hash, u.is_active, u.email_verified,
        r.name as role_name
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
    `, [email.toLowerCase()]);
    
    console.log(`📊 Query returned ${result.rows.length} rows`);
    
    if (result.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = result.rows[0];
    console.log(`✅ User found: ID ${user.id}`);
    
    if (!user.password_hash) {
      console.log(`⚠️ User ${email} has no password set.`);
      return res.status(403).json({
        success: false,
        message: 'Password not set. Please reset your password.',
        code: 'PASSWORD_NOT_SET'
      });
    }
    
    console.log('🔍 Checking password...');
    const passwordValid = await comparePassword(password, user.password_hash);
    console.log(`🔍 Password valid: ${passwordValid}`);
    
    if (!passwordValid) {
      console.log(`❌ Invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log(`✅ Login successful for: ${email}`);
    console.log('🔑 Generating tokens...');

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      userType: user.role_name || 'user'
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    console.log('✅ Tokens generated successfully');

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('✅ Sending success response');
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.role_name || 'user',
        emailVerified: user.email_verified
      },
      accessToken
    });

  } catch (error) {
    console.error('❌ Login error details:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    console.log('🔐 Signup route called');
    console.log('📋 Request body:', { ...req.body, password: '[REDACTED]', confirmPassword: '[REDACTED]' });
    
    const validation = validateRequest(RegisterSchema, req.body);
    if (!validation.success) {
      console.log('❌ Validation failed:', validation.errors.issues);
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        errors: validation.errors.issues
      });
    }

    const { email, password, displayName, firstName, lastName, userType, allergies = [] } = validation.data;
    console.log(`🔐 Signup attempt for: ${email}`);
    
    // Check if user already exists
    console.log('🔍 Checking if user already exists...');
    const existingUser = await query(`
      SELECT id FROM users.accounts WHERE email = $1
    `, [email.toLowerCase()]);
    
    if (existingUser.rows.length > 0) {
      console.log(`❌ User already exists: ${email}`);
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    
    // Hash the password
    console.log('🔒 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create the user
    console.log('👤 Creating new user...');
    const result = await query(`
      INSERT INTO users.accounts (
        email, display_name, first_name, last_name, password_hash, email_verified, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, display_name, first_name, last_name, created_at
    `, [
      email.toLowerCase(),
      displayName,
      firstName || null,
      lastName || null,
      passwordHash,
      false, // email_verified - should be false initially
      true   // is_active
    ]);
    
    const newUser = result.rows[0];
    console.log(`✅ Created user with ID: ${newUser.id}`);
    
    // Save allergy preferences if provided
    if (allergies && allergies.length > 0) {
      console.log(`🔄 Saving ${allergies.length} allergy preferences...`);
      
      // Get allergen IDs from codes
      const allergenQuery = `
        SELECT id, code FROM allergens 
        WHERE code = ANY($1)
      `;
      const allergenResult = await query(allergenQuery, [allergies]);
      
      // Insert allergy preferences
      for (const allergenRow of allergenResult.rows) {
        await query(`
          INSERT INTO users.allergen_preferences (user_id, allergen_id)
          VALUES ($1, $2)
        `, [newUser.id, allergenRow.id]);
      }
      
      console.log(`✅ Saved ${allergenResult.rows.length} allergy preferences`);
    }
    
    // Save user role/profile type
    console.log(`🔄 Saving user role: ${userType}`);
    
    const roleQuery = `
      SELECT id FROM users.roles WHERE name = $1
    `;
    const roleResult = await query(roleQuery, [userType]);
    
    if (roleResult.rows.length > 0) {
      const roleId = roleResult.rows[0].id;
      await query(`
        INSERT INTO users.user_roles (user_id, role_id)
        VALUES ($1, $2)
      `, [newUser.id, roleId]);
      console.log(`✅ Assigned '${userType}' role to user ${newUser.id}`);
    } else {
      console.log(`⚠️ Warning: No "${userType}" role found in database`);
    }
    
    // Generate tokens for immediate login
    console.log('🔑 Generating tokens for new user...');
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      userType: userType
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    console.log('✅ Tokens generated successfully');

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('✅ Sending signup success response');
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.display_name,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        userType: userType,
        emailVerified: false
      },
      accessToken
    });

  } catch (error) {
    console.error('❌ Signup error details:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific database errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export { router as authRouter };