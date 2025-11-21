import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import StockMovement from '@/lib/db/models/StockMovement';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import { generateNextNumber } from '@/lib/utils/number-sequence';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/inventory/movements - Get all stock movements with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const movementType = searchParams.get('movementType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query (don't include isDeleted as the middleware handles it)
    const query: any = {};

    if (itemId) {
      query['item.id'] = itemId;
    }

    if (movementType) {
      query.movementType = movementType;
    }

    if (status) {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate);
      }
    }

    // Execute query with pagination
    // The pre-find middleware automatically filters out isDeleted documents
    const [movements, total] = await Promise.all([
      StockMovement.find(query)
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      StockMovement.countDocuments(query),
    ]);

    return successResponse(movements, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get stock movements error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch stock movements', null, 500);
  }
}

/**
 * POST /api/inventory/movements - Create new stock movement
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    const body = await request.json();

    // Validate required fields
    if (!body.itemId || !body.movementType || body.quantity === undefined) {
      return validationError('Item ID, movement type, and quantity are required');
    }

    await connectDB();

    // Get the inventory item
    const item = await InventoryItem.findById(body.itemId);
    if (!item) {
      return errorResponse('NOT_FOUND', 'Inventory item not found', null, 404);
    }

    // Calculate stock before and after
    const stockBefore = item.currentStock;
    let stockAfter = stockBefore;

    // Determine initial status (default to PENDING for user-created movements)
    const status = body.status || 'PENDING';

    // Only calculate stock changes and update inventory if status is COMPLETED
    if (status === 'COMPLETED') {
      // Calculate stock changes based on movement type
      switch (body.movementType) {
        case 'IN':
        case 'RETURN':
          stockAfter = stockBefore + Math.abs(body.quantity);
          break;
        case 'OUT':
          stockAfter = stockBefore - Math.abs(body.quantity);
          break;
        case 'ADJUSTMENT':
          // For adjustments, quantity can be positive or negative
          stockAfter = stockBefore + body.quantity;
          break;
        case 'TRANSFER':
          // For transfers, this is the "from" location, so it's OUT
          stockAfter = stockBefore - Math.abs(body.quantity);
          break;
      }

      // Validate stock doesn't go negative
      if (stockAfter < 0) {
        return validationError('Insufficient stock for this movement');
      }
    } else {
      // For PENDING movements, stockAfter equals stockBefore (no change yet)
      stockAfter = stockBefore;
    }

    // Auto-generate reference number if not provided
    let referenceNumber = body.referenceNumber
    if (!referenceNumber || referenceNumber.trim() === '') {
      try {
        referenceNumber = await generateNextNumber('STOCK_MOVEMENT')
      } catch (error: any) {
        return errorResponse('INTERNAL_ERROR', `Failed to generate reference number: ${error.message}`, null, 500)
      }
    }

    // Create stock movement
    const movement = await StockMovement.create({
      item: {
        id: item._id,
        itemCode: item.itemCode,
        name: item.name,
      },
      movementType: body.movementType,
      quantity: body.quantity,
      unit: item.unit,
      fromLocation: body.fromLocation,
      toLocation: body.toLocation,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      referenceNumber,
      costPerUnit: body.costPerUnit || item.avgCostPerUnit,
      stockBefore,
      stockAfter,
      reason: body.reason,
      notes: body.notes,
      performedBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      status,
      transactionDate: body.transactionDate || new Date(),
    });

    // Only update inventory item stock if status is COMPLETED
    if (status === 'COMPLETED') {
      item.currentStock = stockAfter;

      // Update average cost if provided and movement is IN
      if (body.costPerUnit && (body.movementType === 'IN' || body.movementType === 'RETURN')) {
        const totalQuantity = item.currentStock;
        const totalCost = (stockBefore * item.avgCostPerUnit) + (Math.abs(body.quantity) * body.costPerUnit);
        item.avgCostPerUnit = totalCost / totalQuantity;
      }

      await item.save();
    }

    return successResponse(movement);
  } catch (error: any) {
    console.error('Create stock movement error:', error);

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors);
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to create stock movement', null, 500);
  }
}
