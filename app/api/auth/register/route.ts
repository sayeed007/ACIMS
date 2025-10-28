import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { User } from '@/lib/db/models';
import {
  createdResponse,
  validationError,
  conflictError,
  internalServerError,
} from '@/lib/utils/api-response';
import { generateToken, generateRefreshToken } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return validationError('Email, password, name, and role are required');
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return validationError('Invalid email format');
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return validationError('Password must be at least 8 characters long');
    }

    // Validate role
    const validRoles = [
      'SUPER_ADMIN',
      'ADMIN',
      'HR_ADMIN',
      'CANTEEN_MANAGER',
      'STORE_KEEPER',
      'DEPARTMENT_HEAD',
      'PURCHASE_COMMITTEE',
    ];

    if (!validRoles.includes(role)) {
      return validationError('Invalid role');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return conflictError('User with this email already exists');
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      role,
      status: 'ACTIVE',
    });

    await user.save();

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

    // Remove password from response
    const { password: _, ...userResponse } = user.toObject();

    return createdResponse({
      user: userResponse,
      token,
      refreshToken,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return internalServerError('Registration failed', error.message);
  }
}
