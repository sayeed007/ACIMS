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
    const search = searchParams.get('search');
    const mealType = searchParams.get('mealType');
    const isActive = searchParams.get('isActive');

    const query: any = { isDeleted: false }; // Exclude soft-deleted meal sessions by default

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by isActive
    if (isActive !== null && isActive !== undefined) {
      query.status = isActive === 'true' ? 'ACTIVE' : 'INACTIVE';
    }

    // Filter by meal type
    if (mealType) {
      query.mealType = mealType;
    }

    // Search by name or code
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total documents matching the query
    const total = await MealSession.countDocuments(query);

    const sessions = await MealSession.find(query)
      .populate('eligibleShifts', 'name code')
      .populate('allowedDepartments', 'name code')
      .sort({ displayOrder: 1, startTime: 1 })
      .lean();

    // Transform data to match frontend expectations
    const transformedSessions = sessions.map((session: any) => ({
      ...session,
      isActive: session.status === 'ACTIVE',
      allowedShifts: session.eligibleShifts?.map((s: any) => s._id?.toString() || s) || [],
    }));

    return successResponse(transformedSessions, {
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
      },
    });
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
      mealType,
      startTime,
      endTime,
      isOvertimeMeal,
      eligibleShifts,
      allowedShifts,
      allowedDepartments,
      maxCapacity,
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

    // Check if code already exists (excluding soft-deleted meal sessions)
    const existingSession = await MealSession.findOne({
      code: code.toUpperCase(),
      isDeleted: false
    });
    if (existingSession) {
      return conflictError('Meal session with this code already exists');
    }

    const session = new MealSession({
      name,
      code: code.toUpperCase(),
      description,
      mealType: mealType || 'LUNCH',
      startTime,
      endTime,
      isOvertimeMeal: isOvertimeMeal || mealType === 'OVERTIME_MEAL',
      eligibleShifts: allowedShifts || eligibleShifts || [],
      allowedDepartments: allowedDepartments || [],
      maxCapacity: maxCapacity || 0,
      displayOrder: displayOrder || 0,
      status: 'ACTIVE',
    });

    await session.save();

    // Transform response to match frontend expectations
    const responseData = {
      ...session.toObject(),
      isActive: session.status === 'ACTIVE',
      allowedShifts: session.eligibleShifts,
    };

    return createdResponse(responseData);
  } catch (error: any) {
    console.error('Create meal session error:', error);
    return internalServerError('Failed to create meal session', error.message);
  }
}
