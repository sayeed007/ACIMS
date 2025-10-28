import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import StockMovement from '@/lib/db/models/StockMovement';
import { successResponse, errorResponse, notFoundError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/inventory/movements/:id - Get single stock movement
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

    const movement = await StockMovement.findOne({
      _id: id,
      isDeleted: false,
    }).lean();

    if (!movement) {
      return NextResponse.json(
        notFoundError('Stock movement not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(movement));
  } catch (error: any) {
    console.error('Get stock movement error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch stock movement', null, 500),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/movements/:id - Update stock movement
 * Note: Only certain fields can be updated (notes, status, approval)
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

    // Find the movement
    const movement = await StockMovement.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!movement) {
      return NextResponse.json(
        notFoundError('Stock movement not found'),
        { status: 404 }
      );
    }

    // Only allow updating certain fields
    if (body.notes !== undefined) {
      movement.notes = body.notes;
    }

    if (body.status !== undefined) {
      movement.status = body.status;
    }

    // Handle approval
    if (body.approve === true && movement.status === 'PENDING') {
      movement.status = 'APPROVED';
      movement.approvedBy = {
        id: user._id,
        name: user.name,
        email: user.email,
        approvedAt: new Date(),
      };
    }

    await movement.save();

    return NextResponse.json(successResponse(movement));
  } catch (error: any) {
    console.error('Update stock movement error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update stock movement', null, 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventory/movements/:id - Soft delete stock movement
 * Note: This should reverse the stock changes
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

    const movement = await StockMovement.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!movement) {
      return NextResponse.json(
        notFoundError('Stock movement not found'),
        { status: 404 }
      );
    }

    // Mark as deleted (soft delete)
    movement.isDeleted = true;
    await movement.save();

    // Note: In a real system, you might want to create a reverse movement
    // or prevent deletion of completed movements

    return NextResponse.json(successResponse({ message: 'Stock movement deleted successfully' }));
  } catch (error: any) {
    console.error('Delete stock movement error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete stock movement', null, 500),
      { status: 500 }
    );
  }
}
