import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { User } from '../db/models';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '30m', // 30 minutes
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7 days
  });
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(headersList: Headers): string | null {
  const authHeader = headersList.get('authorization');

  if (!authHeader) {
    return null;
  }

  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Get current user from request
 * Use this in API routes to get authenticated user
 */
export async function getCurrentUser() {
  try {
    const headersList = await headers();
    const token = getTokenFromHeader(headersList);

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Fetch user from database
    const user = await User.findById(payload.userId)
      .select('-password')
      .populate('department', 'name code')
      .lean();

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Require authentication middleware
 * Returns user or throws error
 */
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Check if user has required role
 */
export function hasRole(
  userRole: string,
  requiredRoles: string | string[]
): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return roles.includes(userRole);
}

/**
 * Check if user has required permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string | string[]
): boolean {
  const permissions = Array.isArray(requiredPermission)
    ? requiredPermission
    : [requiredPermission];

  return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Require specific role
 */
export async function requireRole(requiredRoles: string | string[]) {
  const user = await requireAuth();

  if (!hasRole(user.role, requiredRoles)) {
    throw new Error('Insufficient permissions');
  }

  return user;
}

/**
 * Get client IP address
 */
export function getClientIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for');
  const real = headersList.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (real) {
    return real;
  }

  return 'unknown';
}

/**
 * Get user agent
 */
export function getUserAgent(headersList: Headers): string {
  return headersList.get('user-agent') || 'unknown';
}
