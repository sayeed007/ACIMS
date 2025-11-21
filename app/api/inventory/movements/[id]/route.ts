import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import StockMovement from '@/lib/db/models/StockMovement';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { successResponse, errorResponse, notFoundError, validationError } from '@/lib/utils/api-response';
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    const { id } = await params;
    await connectDB();

    const movement = await StockMovement.findById(id).lean();

    if (!movement) {
      return notFoundError('Stock movement not found');
    }

    return successResponse(movement);
  } catch (error: any) {
    console.error('Get stock movement error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch stock movement', null, 500);
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    const { id } = await params;
    const body = await request.json();
    await connectDB();

    // Find the movement
    const movement = await StockMovement.findById(id);

    if (!movement) {
      return notFoundError('Stock movement not found');
    }

    // Store old status to detect changes
    const oldStatus = movement.status;

    // For PENDING movements, allow updating all fields
    if (movement.status === 'PENDING') {
      if (body.itemId !== undefined) {
        // Verify the new item exists
        const newItem = await InventoryItem.findById(body.itemId);
        if (!newItem) {
          return errorResponse('NOT_FOUND', 'Inventory item not found', null, 404);
        }
        movement.item = {
          id: newItem._id,
          itemCode: newItem.itemCode,
          name: newItem.name,
        };
        movement.unit = newItem.unit;
        // Update stockBefore to reflect the new item's current stock
        movement.stockBefore = newItem.currentStock;
        movement.stockAfter = newItem.currentStock; // For PENDING, stockAfter equals stockBefore
      }

      if (body.movementType !== undefined) {
        movement.movementType = body.movementType;
      }

      if (body.quantity !== undefined) {
        movement.quantity = body.quantity;
      }

      if (body.fromLocation !== undefined) {
        movement.fromLocation = body.fromLocation;
      }

      if (body.toLocation !== undefined) {
        movement.toLocation = body.toLocation;
      }

      if (body.referenceType !== undefined) {
        movement.referenceType = body.referenceType;
      }

      if (body.referenceNumber !== undefined) {
        movement.referenceNumber = body.referenceNumber;
      }

      if (body.costPerUnit !== undefined) {
        movement.costPerUnit = body.costPerUnit;
        movement.totalCost = body.costPerUnit * movement.quantity;
      }

      if (body.reason !== undefined) {
        movement.reason = body.reason;
      }

      if (body.transactionDate !== undefined) {
        movement.transactionDate = body.transactionDate;
      }
    }

    // Notes can be updated for any movement
    if (body.notes !== undefined) {
      movement.notes = body.notes;
    }

    // Status can be updated for any movement
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

    // If status changed to COMPLETED, update inventory stock
    if (oldStatus !== 'COMPLETED' && movement.status === 'COMPLETED') {
      // Get the inventory item
      const item = await InventoryItem.findById(movement.item.id);
      if (!item) {
        return errorResponse('NOT_FOUND', 'Inventory item not found', null, 404);
      }

      // Update stockBefore to reflect current stock at completion time
      movement.stockBefore = item.currentStock;

      // Calculate new stock based on movement type
      let newStock = item.currentStock;
      switch (movement.movementType) {
        case 'IN':
        case 'RETURN':
          newStock = item.currentStock + Math.abs(movement.quantity);
          break;
        case 'OUT':
          newStock = item.currentStock - Math.abs(movement.quantity);
          break;
        case 'ADJUSTMENT':
          newStock = item.currentStock + movement.quantity;
          break;
        case 'TRANSFER':
          newStock = item.currentStock - Math.abs(movement.quantity);
          break;
      }

      // Validate stock doesn't go negative
      if (newStock < 0) {
        return validationError('Insufficient stock for this movement');
      }

      // Update stockAfter in movement
      movement.stockAfter = newStock;

      // Update inventory item
      item.currentStock = newStock;

      // Update average cost if cost provided and movement is IN
      if (movement.costPerUnit && (movement.movementType === 'IN' || movement.movementType === 'RETURN')) {
        const totalQuantity = item.currentStock;
        const totalCost = (movement.stockBefore * item.avgCostPerUnit) + (Math.abs(movement.quantity) * movement.costPerUnit);
        item.avgCostPerUnit = totalCost / totalQuantity;
      }

      await item.save();
    }

    await movement.save();

    return successResponse(movement);
  } catch (error: any) {
    console.error('Update stock movement error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to update stock movement', null, 500);
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    const { id } = await params;
    await connectDB();

    const movement = await StockMovement.findById(id);

    if (!movement) {
      return notFoundError('Stock movement not found');
    }

    // Mark as deleted (soft delete)
    movement.isDeleted = true;
    await movement.save();

    // Note: In a real system, you might want to create a reverse movement
    // or prevent deletion of completed movements

    return successResponse({ message: 'Stock movement deleted successfully' });
  } catch (error: any) {
    console.error('Delete stock movement error:', error);
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete stock movement', null, 500);
  }
}
