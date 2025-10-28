import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Department from '@/lib/db/models/Department';
import { successResponse, errorResponse, notFoundError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/departments/:id - Get single department
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

    const department = await Department.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!department) {
      return NextResponse.json(
        notFoundError('Department not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(department));
  } catch (error: any) {
    console.error('Get department error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch department', null, 500),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/departments/:id - Update department
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

    const department = await Department.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();

    if (!department) {
      return NextResponse.json(
        notFoundError('Department not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(department));
  } catch (error: any) {
    console.error('Update department error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        errorResponse('DUPLICATE_ERROR', 'Department code already exists', error, 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update department', null, 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/departments/:id - Soft delete department
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

    const department = await Department.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).lean();

    if (!department) {
      return NextResponse.json(
        notFoundError('Department not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse({ message: 'Department deleted successfully' }));
  } catch (error: any) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete department', null, 500),
      { status: 500 }
    );
  }
}
