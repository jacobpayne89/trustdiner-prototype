import { Router, Request, Response } from 'express';
import { query } from '../services/database';
import bcrypt from 'bcrypt';

const router = Router();

/**
 * GET /api/debug-auth/:email
 * Debug endpoint to check user account status and test password
 */
router.get('/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const { testPassword } = req.query;
    
    console.log(`🔍 Debug auth check for: ${email}`);
    
    // Get user with role info (same query as auth route)
    const result = await query(`
      SELECT 
        u.id, u.email, u.display_name, u.first_name, u.last_name,
        u.password_hash, u.is_active, u.email_verified,
        COALESCE(r.name, 'user') as user_type
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      WHERE u.email = $1 AND u.is_active = true
    `, [email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.json({
        found: false,
        message: 'User not found in database'
      });
    }
    
    const user = result.rows[0];
    
    let passwordTest = null;
    if (testPassword && user.password_hash) {
      try {
        const isValid = await bcrypt.compare(testPassword as string, user.password_hash);
        passwordTest = {
          testPassword: testPassword as string,
          isValid,
          hashExists: !!user.password_hash,
          hashPreview: user.password_hash ? user.password_hash.substring(0, 20) + '...' : null
        };
      } catch (error) {
        passwordTest = {
          testPassword: testPassword as string,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    res.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        isActive: user.is_active,
        emailVerified: user.email_verified,
        hasPassword: !!user.password_hash,
        passwordHashPreview: user.password_hash ? user.password_hash.substring(0, 20) + '...' : null
      },
      passwordTest,
      instructions: {
        message: 'To test password, add ?testPassword=YourPassword to the URL',
        example: `/api/debug-auth/${email}?testPassword=TrustDiner123!`
      }
    });
    
  } catch (error) {
    console.error('❌ Debug auth error:', error);
    res.status(500).json({
      error: 'Debug auth failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/debug-auth/set-password
 * Debug endpoint to set a new password hash
 */
router.post('/set-password', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password required'
      });
    }
    
    console.log(`🔧 Setting new password for: ${email}`);
    
    // Generate new hash
    const saltRounds = 10;
    const newHash = await bcrypt.hash(password, saltRounds);
    
    // Update password
    const result = await query(`
      UPDATE users.accounts 
      SET password_hash = $1, updated_at = NOW()
      WHERE email = $2 AND is_active = true
      RETURNING id, email, display_name
    `, [newHash, email.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    // Test the new password immediately
    const testResult = await bcrypt.compare(password, newHash);
    
    res.json({
      success: true,
      message: 'Password updated successfully',
      user: result.rows[0],
      passwordTest: {
        password,
        hashWorks: testResult,
        newHashPreview: newHash.substring(0, 20) + '...'
      }
    });
    
  } catch (error) {
    console.error('❌ Set password error:', error);
    res.status(500).json({
      error: 'Failed to set password',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as debugAuthRouter };

