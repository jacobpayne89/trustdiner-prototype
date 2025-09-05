import { Request, Response, NextFunction } from 'express';
import { getPool } from '../services/database';

// Extend Request interface to include user info
declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: number;
        email: string;
        displayName: string;
      };
    }
  }
}

/**
 * Middleware to protect admin routes
 * Verifies user authentication and admin privileges
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For development, we'll use a simple user ID check from headers
    // In production, this should be JWT-based or session-based
    const userId = req.headers['x-user-id'] as string;
    

    
    if (!userId) {
      console.log('❌ Admin endpoint accessed without user ID header');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User ID header is required for admin access'
      });
    }

    const pool = getPool();
    
    // Verify user exists and has admin role
    const userResult = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.display_name,
        r.name as role_name
      FROM users.accounts u
      LEFT JOIN users.user_roles ur ON u.id = ur.user_id
      LEFT JOIN users.roles r ON ur.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
    `, [parseInt(userId)]);

    if (userResult.rows.length === 0) {
      console.log(`❌ Admin access: User ${userId} not found`);
      return res.status(401).json({
        error: 'User not found',
        message: 'Invalid user credentials'
      });
    }

    const user = userResult.rows[0];
    
    if (user.role_name !== 'admin') {
      // Log unauthorized access attempt
      await logAdminAction(parseInt(userId), 'UNAUTHORIZED_ACCESS', 'admin_middleware', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userRole: user.role_name || 'none'
      });

      console.log(`❌ Admin access denied: ${user.display_name} (${user.email}) has role '${user.role_name || 'none'}' -> ${req.method} ${req.path}`);
      return res.status(403).json({
        error: 'Insufficient privileges',
        message: 'Admin access required for this endpoint'
      });
    }

    // Add user info to request for logging
    req.adminUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name
    };

    console.log(`🔐 Admin access granted: ${user.display_name} (${user.email}) -> ${req.method} ${req.path}`);
    next();

  } catch (error) {
    console.error('❌ Admin auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error',
      message: 'Unable to verify admin privileges'
    });
  }
};

/**
 * Log admin actions to audit table
 */
export const logAdminAction = async (
  userId: number,
  action: string,
  resourceType: string,
  details: any = {},
  resourceId?: string
) => {
  try {
    const pool = getPool();
    
    await pool.query(`
      INSERT INTO admin_audit_log (
        user_id, action, resource_type, resource_id, details, created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      userId,
      action,
      resourceType,
      resourceId || null,
      JSON.stringify(details)
    ]);

    console.log(`📋 Admin action logged: ${action} on ${resourceType} by user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Middleware to log admin actions automatically
 */
export const logAdminActionMiddleware = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept successful responses
    const originalJson = res.json;
    
    res.json = function(body: any) {
      // Only log if the operation was successful (2xx status)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.adminUser) {
        const resourceId = req.params.id || body?.id || body?.establishment?.id || body?.chain?.id;
        
        logAdminAction(
          req.adminUser.id,
          action,
          resourceType,
          {
            endpoint: req.path,
            method: req.method,
            params: req.params,
            body: req.method !== 'GET' ? req.body : undefined,
            ip: req.ip,
            userAgent: req.get('User-Agent')
          },
          resourceId
        );
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};
