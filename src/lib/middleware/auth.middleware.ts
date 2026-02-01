/**
 * JWT Authentication Middleware
 * Handles user authentication and token generation
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId: string, email: string, name?: string): string {
  const payload = {
    userId,
    email,
    name
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware function to validate authentication
 */
export async function requireAuth(authHeader: string | null): Promise<{
  success: boolean;
  payload?: TokenPayload;
  error?: string;
}> {
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      success: false,
      error: 'No authentication token provided'
    };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return {
      success: false,
      error: 'Invalid or expired token'
    };
  }

  return {
    success: true,
    payload
  };
}

/**
 * Generate a session token for interview
 */
export function generateSessionToken(sessionId: string): string {
  const payload = {
    sessionId,
    type: 'interview_session',
    timestamp: Date.now()
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '4h' // Interview sessions are shorter
  });
}

/**
 * Verify session token
 */
export function verifySessionToken(token: string): {
  sessionId: string;
  type: string;
  timestamp: number;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      sessionId: string;
      type: string;
      timestamp: number;
    };

    if (decoded.type !== 'interview_session') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Session token verification failed:', error);
    return null;
  }
}
