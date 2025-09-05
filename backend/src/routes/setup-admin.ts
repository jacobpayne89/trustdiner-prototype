import { Router, Request, Response } from 'express';
import { query } from '../services/database';

const router = Router();

/**
 * GET /api/setup-admin
 * One-time setup endpoint to create admin account
 * This should be removed after setup is complete
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('🔧 Setting up admin account...');
    
    // Create roles
    await query(`
      INSERT INTO users.roles (name, description) 
      VALUES ('admin', 'Administrator with full system access')
      ON CONFLICT (name) DO NOTHING
    `);
    
    await query(`
      INSERT INTO users.roles (name, description) 
      VALUES ('user', 'Standard user with basic access')
      ON CONFLICT (name) DO NOTHING
    `);
    
    console.log('✅ Roles created');
    
    // Create/update user account
    await query(`
      INSERT INTO users.accounts (
          email, display_name, first_name, last_name, is_active, email_verified
      ) VALUES (
          'jacobpayne89@gmail.com', 'Jacob Payne', 'Jacob', 'Payne', true, true
      ) ON CONFLICT (email) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          is_active = true,
          email_verified = true
    `);
    
    console.log('✅ User account created/updated');
    
    // Remove existing roles
    await query(`
      DELETE FROM users.user_roles WHERE user_id = (
          SELECT id FROM users.accounts WHERE email = 'jacobpayne89@gmail.com'
      )
    `);
    
    // Assign admin role
    await query(`
      INSERT INTO users.user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users.accounts u, users.roles r 
      WHERE u.email = 'jacobpayne89@gmail.com' AND r.name = 'admin'
    `);
    
    console.log('✅ Admin role assigned');
    
    // Set password hash for "TrustDiner123!"
    await query(`
      UPDATE users.accounts 
      SET password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMye.fDdHklqH6orfOrYrcLhXdOWEgvqnwu'
      WHERE email = 'jacobpayne89@gmail.com'
    `);
    
    console.log('✅ Password set');
    
    // Verify setup
    const result = await query(`
      SELECT 
          u.id, u.email, u.display_name, u.email_verified, u.is_active,
          CASE WHEN u.password_hash IS NOT NULL THEN 'Password Set' ELSE 'No Password' END as password_status,
          COALESCE(r.name, 'no role') as role_name
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      WHERE u.email = 'jacobpayne89@gmail.com'
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      
      const response = {
        success: true,
        message: 'Admin account setup completed successfully!',
        account: {
          id: user.id,
          email: user.email,
          name: user.display_name,
          emailVerified: user.email_verified,
          active: user.is_active,
          passwordStatus: user.password_status,
          role: user.role_name
        },
        loginCredentials: {
          email: 'jacobpayne89@gmail.com',
          password: 'TrustDiner123!'
        },
        nextSteps: [
          'Your admin account is now ready',
          'You can login with the credentials above',
          'You will have full admin access to /admin dashboard',
          'Your reviews will show on /profile page',
          'Remember to remove this setup endpoint after use'
        ]
      };
      
      console.log('🎉 Admin setup completed successfully!');
      res.json(response);
      
    } else {
      throw new Error('Failed to verify admin account creation');
    }
    
  } catch (error) {
    console.error('❌ Admin setup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to setup admin account',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as setupAdminRouter };

