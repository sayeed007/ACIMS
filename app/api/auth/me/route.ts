import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import {
  successResponse,
  unauthorizedError,
  internalServerError,
} from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();

    if (!user) {
      return unauthorizedError('Not authenticated');
    }

    return successResponse({ user });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return internalServerError('Failed to get user', error.message);
  }
}
