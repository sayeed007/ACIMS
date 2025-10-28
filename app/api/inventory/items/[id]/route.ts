import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { successResponse, errorResponse, notFoundError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/inventory/items/:id - Get single inventory item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    await connectDB();

    const item = await InventoryItem.findOne({
      _id: params.id,
      isDeleted: false,
    }).lean();

    if (!item) {
      return NextResponse.json(
        notFoundError('Inventory item not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(item));
  } catch (error: any) {
    console.error('Get inventory item error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch inventory item', null, 500),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/inventory/items/:id - Update inventory item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    const body = await request.json();
    await connectDB();

    // Prepare update data
    const updateData: any = {
      ...body,
      updatedBy: user._id,
      updatedAt: new Date(),
    };

    // Update category if provided
    if (body.category && typeof body.category === 'string') {
      updateData['category.name'] = body.category;
      delete updateData.category;
    }

    // Uppercase item code and unit if provided
    if (body.itemCode) {
      updateData.itemCode = body.itemCode.toUpperCase();
    }
    if (body.unit) {
      updateData.unit = body.unit.toUpperCase();
    }

    const item = await InventoryItem.findOneAndUpdate(
      { _id: params.id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return NextResponse.json(
        notFoundError('Inventory item not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(item));
  } catch (error: any) {
    console.error('Update inventory item error:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        errorResponse('DUPLICATE_ERROR', 'Item code already exists', error, 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update inventory item', null, 500),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inventory/items/:id - Soft delete inventory item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      );
    }

    await connectDB();

    const item = await InventoryItem.findOneAndUpdate(
      { _id: params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date(), updatedBy: user._id },
      { new: true }
    ).lean();

    if (!item) {
      return NextResponse.json(
        notFoundError('Inventory item not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse({ message: 'Inventory item deleted successfully' }));
  } catch (error: any) {
    console.error('Delete inventory item error:', error);
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete inventory item', null, 500),
      { status: 500 }
    );
  }
}
