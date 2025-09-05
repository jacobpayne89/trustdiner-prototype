import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  email: string;
  userType: string;
}

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }
  return value;
};

export function signAccessToken(payload: JwtPayload): string {
  const secret = getRequiredEnv('JWT_SECRET');
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });
}

export function signRefreshToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET; // Use same secret for simplicity
  return jwt.sign({ ...payload, type: 'refresh' }, secret, {
    expiresIn: '7d',
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = getRequiredEnv('JWT_SECRET');
  const decoded = jwt.verify(token, secret) as JwtPayload;
  return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = getRequiredEnv('JWT_SECRET');
  const decoded = jwt.verify(token, secret) as JwtPayload & { type: string };
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid refresh token');
  }
  return { userId: decoded.userId, email: decoded.email, userType: decoded.userType };
}



