import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Shift from '@/lib/db/models/Shift';
import { successResponse, errorResponse, notFoundError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/shifts/:id - Get single shift
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

    const shift = await Shift.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!shift) {
      return NextResponse.json(
        notFoundError('Shift not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(shift));
  } catch (error: any) {
    console.error('Get shift error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch shift', null, 500),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/shifts/:id - Update shift
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

    const shift = await Shift.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!shift) {
      return NextResponse.json(
        notFoundError('Shift not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(shift));
  } catch (error: any) {
    console.error('Update shift error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        errorResponse('DUPLICATE_ERROR', 'Shift code already exists', error, 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update shift', null, 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shifts/:id - Soft delete shift
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

    const shift = await Shift.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!shift) {
      return NextResponse.json(
        notFoundError('Shift not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse({ message: 'Shift deleted successfully' }));
  } catch (error: any) {
    console.error('Delete shift error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete shift', null, 500),
      { status: 500 }
    );
  }
}
