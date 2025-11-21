import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import mongoose from 'mongoose';

/**
 * GET /api/inventory/items - Get all inventory items with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isDeleted: false }; // Explicitly exclude soft-deleted items

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query['category.name'] = category;
    }

    if (status) {
      query.status = status;
    }

    // Low stock filter - items where currentStock <= reorderLevel
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }

    // Execute query with pagination
    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryItem.countDocuments(query),
    ]);

    return successResponse(items, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get inventory items error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch inventory items', null, 500);
  }
}

/**
 * POST /api/inventory/items - Create new inventory item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    const body = await request.json();

    // Validate required fields
    if (!body.itemCode || !body.name || !body.category || !body.unit) {
      return validationError('Item code, name, category, and unit are required');
    }

    await connectDB();

    // Check if item code already exists (excluding soft-deleted items)
    const existingItem = await InventoryItem.findOne({
      itemCode: body.itemCode.toUpperCase(),
      isDeleted: false
    });
    if (existingItem) {
      return errorResponse('DUPLICATE_ERROR', 'Item code already exists', null, 400);
    }

    // Create inventory item with category object
    const newItem = await InventoryItem.create({
      itemCode: body.itemCode.toUpperCase(),
      name: body.name,
      description: body.description,
      category: {
        id: new mongoose.Types.ObjectId(), // Temporary ID until we have category management
        name: body.category,
      },
      unit: body.unit.toUpperCase(),
      currentStock: body.currentStock || 0,
      reorderLevel: body.reorderLevel || 0,
      reorderQuantity: body.reorderQuantity,
      avgCostPerUnit: body.avgCostPerUnit || 0,
      totalValue: (body.currentStock || 0) * (body.avgCostPerUnit || 0),
      storageLocation: body.storageLocation,
      shelfLife: body.shelfLife,
      status: 'ACTIVE',
      createdBy: user._id,
      updatedBy: user._id,
    });

    return successResponse(newItem);
  } catch (error: any) {
    console.error('Create inventory item error:', error);

    if (error.code === 11000) {
      return errorResponse('DUPLICATE_ERROR', 'Item code already exists', error, 400);
    }

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors);
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to create inventory item', null, 500);
  }
}
