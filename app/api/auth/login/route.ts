import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import {
  successResponse,
  validationError,
  unauthorizedError,
  internalServerError,
} from '@/lib/utils/api-response';
import { generateToken, generateRefreshToken } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/login
 * Login user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt for email:', email);
    console.log('Request body keys:', Object.keys(body));

    // Validation
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return validationError('Email and password are required');
    }

    // Find user and include password field
    const user = await User.findOne({ email })
      .select('+password')
      .populate('department', 'name code');

    if (!user) {
      console.log('User not found for email:', email);
      return unauthorizedError('Invalid email or password');
    }

    console.log('User found:', { email: user.email, status: user.status, hasPassword: !!user.password });

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      console.log('User account is not active:', user.status);
      return unauthorizedError(`Account is ${user.status.toLowerCase()}`);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password validation result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password comparison failed for user:', email);
      return unauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return successResponse({
      user: userResponse,
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return internalServerError('Login failed', error.message);
  }
}
