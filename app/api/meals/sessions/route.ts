import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { MealSession } from '@/lib/db/models';
import {
  successResponse,
  createdResponse,
  validationError,
  conflictError,
  unauthorizedError,
  internalServerError,
} from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/meals/sessions
 * Get all meal sessions
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const sessions = await MealSession.find(query)
      .populate('eligibleShifts', 'name code')
      .sort({ displayOrder: 1, startTime: 1 })
      .lean();

    return successResponse(sessions);
  } catch (error: any) {
    console.error('Get meal sessions error:', error);
    return internalServerError('Failed to fetch meal sessions', error.message);
  }
}

/**
 * POST /api/meals/sessions
 * Create new meal session
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Only ADMIN and CANTEEN_MANAGER can create meal sessions
    if (!['ADMIN', 'SUPER_ADMIN', 'CANTEEN_MANAGER'].includes(user.role)) {
      return unauthorizedError('Insufficient permissions');
    }

    const body = await request.json();
    const {
      name,
      code,
      description,
      startTime,
      endTime,
      isOvertimeMeal,
      eligibleShifts,
      displayOrder,
    } = body;

    // Validation
    if (!name || !code || !startTime || !endTime) {
      return validationError('Name, code, start time, and end time are required');
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return validationError('Invalid time format. Use HH:mm format');
    }

    // Check if code already exists
    const existingSession = await MealSession.findOne({ code: code.toUpperCase() });
    if (existingSession) {
      return conflictError('Meal session with this code already exists');
    }

    const session = new MealSession({
      name,
      code: code.toUpperCase(),
      description,
      startTime,
      endTime,
      isOvertimeMeal: isOvertimeMeal || false,
      eligibleShifts: eligibleShifts || [],
      displayOrder: displayOrder || 0,
      status: 'ACTIVE',
    });

    await session.save();

    return createdResponse(session);
  } catch (error: any) {
    console.error('Create meal session error:', error);
    return internalServerError('Failed to create meal session', error.message);
  }
}
