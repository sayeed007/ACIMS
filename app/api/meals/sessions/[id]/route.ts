import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import MealSession from '@/lib/db/models/MealSession';
import { successResponse, errorResponse, notFoundError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/meals/sessions/:id - Get single meal session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const session = await MealSession.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate('eligibleShifts', 'name code')
      .populate('allowedDepartments', 'name code')
      .lean();

    if (!session) {
      return NextResponse.json(
        notFoundError('Meal session not found'),
        { status: 404 }
      );
    }

    // Transform data to match frontend expectations
    const transformedSession = {
      ...session,
      isActive: session.status === 'ACTIVE',
      allowedShifts: session.eligibleShifts?.map((s: any) => s._id?.toString() || s) || [],
    };

    return NextResponse.json(successResponse(transformedSession));
  } catch (error: any) {
    console.error('Get meal session error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch meal session', null, 500),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meals/sessions/:id - Update meal session
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    await connectDB();

    // Transform frontend fields to backend fields
    const updateData: any = { ...body };

    // Handle isActive -> status conversion
    if ('isActive' in body) {
      updateData.status = body.isActive ? 'ACTIVE' : 'INACTIVE';
      delete updateData.isActive;
    }

    // Handle allowedShifts -> eligibleShifts conversion
    if ('allowedShifts' in body) {
      updateData.eligibleShifts = body.allowedShifts;
      delete updateData.allowedShifts;
    }

    // Update mealType and adjust isOvertimeMeal accordingly
    if (updateData.mealType === 'OVERTIME_MEAL') {
      updateData.isOvertimeMeal = true;
    } else if ('mealType' in updateData) {
      updateData.isOvertimeMeal = false;
    }

    updateData.updatedAt = new Date();

    const session = await MealSession.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('eligibleShifts', 'name code')
      .populate('allowedDepartments', 'name code')
      .lean();

    if (!session) {
      return NextResponse.json(
        notFoundError('Meal session not found'),
        { status: 404 }
      );
    }

    // Transform response to match frontend expectations
    const transformedSession = {
      ...session,
      isActive: session.status === 'ACTIVE',
      allowedShifts: session.eligibleShifts?.map((s: any) => s._id?.toString() || s) || [],
    };

    return NextResponse.json(successResponse(transformedSession));
  } catch (error: any) {
    console.error('Update meal session error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        errorResponse('DUPLICATE_ERROR', 'Meal session code already exists', error, 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update meal session', null, 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meals/sessions/:id - Soft delete meal session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    const { id } = await params;
    await connectDB();

    const session = await MealSession.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!session) {
      return NextResponse.json(
        notFoundError('Meal session not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse({ message: 'Meal session deleted successfully' }));
  } catch (error: any) {
    console.error('Delete meal session error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete meal session', null, 500),
      { status: 500 }
    );
  }
}
