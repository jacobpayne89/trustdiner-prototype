import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { getPool } from '../services/database';
import { signAccessToken } from '../services/jwt';

const router = Router();

const parseTtlMs = (): number => {
  const raw = process.env.JWT_REFRESH_TTL || '7d';
  const m = raw.match(/^(\d+)([smhd])$/);
  if (!m) return 7 * 24 * 3600 * 1000;
  const n = Number(m[1]);
  const mult = m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400;
  return n * mult * 1000;
};

const sha256 = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const rt = (req.body as any)?.refreshToken;
    if (!rt) return res.status(400).json({ error: 'missing_refresh' });

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT rt.id, rt.expires_at, rt.revoked_at,
              u.id as user_id, u.email, COALESCE(u.user_type,'standard') as role
       FROM refresh_tokens rt
       JOIN users.accounts u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
       LIMIT 1`,
      [sha256(rt)]
    );

    const row = rows[0];
    if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
      return res.status(401).json({ error: 'invalid_refresh' });
    }

    // revoke old
    await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [row.id]);

    // issue new refresh
    const ttl = parseTtlMs();
    const newRt = crypto.randomBytes(48).toString('base64url');
    const exp = new Date(Date.now() + ttl);
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)`,
      [row.user_id, sha256(newRt), exp.toISOString()]
    );

    // access token
    const accessToken = signAccessToken({ sub: row.user_id, email: row.email, role: row.role });
    res.json({ accessToken, refreshToken: newRt, expiresAt: exp.toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'refresh_failed' });
  }
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const rt = (req.body as any)?.refreshToken;
    if (rt) {
      const pool = getPool();
      await pool.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL`, [sha256(rt)]);
    }
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

export default router;



