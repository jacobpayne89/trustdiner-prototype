import crypto from 'crypto';
import { getPool } from './database';

/**
 * Email Service for TrustDiner
 * Handles email verification and transactional emails
 */

export interface EmailVerificationToken {
  token: string;
  userId: number;
  expiresAt: Date;
}

export class EmailService {
  /**
   * Generate a secure verification token
   */
  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Store email verification token in database
   */
  static async storeVerificationToken(userId: number, token: string): Promise<void> {
    const pool = getPool();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    await pool.query(`
      INSERT INTO "user".email_verification (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (token) DO UPDATE SET
        expires_at = EXCLUDED.expires_at,
        created_at = CURRENT_TIMESTAMP
    `, [userId, token, expiresAt]);

    console.log(`📧 Verification token stored for user ${userId}, expires at ${expiresAt.toISOString()}`);
  }

  /**
   * Validate and consume verification token
   */
  static async validateVerificationToken(token: string): Promise<{ valid: boolean; userId?: number; expired?: boolean }> {
    const pool = getPool();
    
    const result = await pool.query(`
      SELECT user_id, expires_at, verified_at
      FROM "user".email_verification
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      console.log(`❌ Invalid verification token: ${token}`);
      return { valid: false };
    }

    const verification = result.rows[0];
    
    // Check if already used
    if (verification.verified_at) {
      console.log(`❌ Verification token already used: ${token}`);
      return { valid: false };
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    if (now > expiresAt) {
      console.log(`❌ Verification token expired: ${token}`);
      return { valid: false, expired: true };
    }

    console.log(`✅ Valid verification token for user ${verification.user_id}`);
    return { valid: true, userId: verification.user_id };
  }

  /**
   * Mark verification token as used
   */
  static async markTokenAsUsed(token: string): Promise<void> {
    const pool = getPool();
    
    await pool.query(`
      UPDATE "user".email_verification
      SET verified_at = CURRENT_TIMESTAMP
      WHERE token = $1
    `, [token]);

    console.log(`✅ Verification token marked as used: ${token}`);
  }

  /**
   * Send verification email (placeholder implementation)
   * In production, this would use AWS SES
   */
  static async sendVerificationEmail(email: string, token: string, displayName?: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      console.log(`📧 MOCK EMAIL SEND:`);
      console.log(`   To: ${email}`);
      console.log(`   Subject: Verify your TrustDiner account`);
      console.log(`   Verification URL: ${verificationUrl}`);
      console.log(`   Display Name: ${displayName || 'User'}`);
      
      // In production, replace this with actual SES implementation:
      /*
      const ses = new AWS.SES({ region: 'us-east-1' });
      const params = {
        Source: 'hello@trustdiner.com',
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: 'Verify your TrustDiner account' },
          Body: {
            Html: {
              Data: `
                <h2>Welcome to TrustDiner, ${displayName || 'User'}!</h2>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="${verificationUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
                <p>Or copy and paste this link: ${verificationUrl}</p>
                <p>This link will expire in 24 hours.</p>
                <p>If you didn't create this account, please ignore this email.</p>
              `
            }
          }
        }
      };
      await ses.sendEmail(params).promise();
      */

      // For development, just log success
      console.log(`✅ Mock verification email sent to ${email}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send verification email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired verification tokens
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const pool = getPool();
    
    const result = await pool.query(`
      DELETE FROM "user".email_verification
      WHERE expires_at < CURRENT_TIMESTAMP
      AND verified_at IS NULL
    `);

    const deletedCount = result.rowCount || 0;
    console.log(`🧹 Cleaned up ${deletedCount} expired verification tokens`);
    return deletedCount;
  }
}
