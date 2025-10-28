import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose';
import Reconciliation from '@/lib/db/models/Reconciliation'
import InventoryItem from '@/lib/db/models/InventoryItem'
import StockMovement from '@/lib/db/models/StockMovement'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/inventory/reconciliations - Get all reconciliations with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = { isDeleted: false }

    if (itemId) {
      query['item.id'] = itemId
    }

    if (status) {
      query.status = status
    }

    // Date range filter
    if (startDate || endDate) {
      query.reconciliationDate = {}
      if (startDate) {
        query.reconciliationDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.reconciliationDate.$lte = new Date(endDate)
      }
    }

    // Execute query with pagination
    const [reconciliations, total] = await Promise.all([
      Reconciliation.find(query)
        .sort({ reconciliationDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Reconciliation.countDocuments(query),
    ])

    return NextResponse.json(
      successResponse(reconciliations, {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    )
  } catch (error: any) {
    console.error('Get reconciliations error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch reconciliations', null, 500),
      { status: 500 }
    )
  }
}

/**
 * POST /api/inventory/reconciliations - Create new reconciliation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.itemId || body.physicalStock === undefined) {
      return NextResponse.json(
        validationError('Item ID and physical stock are required'),
        { status: 400 }
      )
    }

    await connectDB()

    // Get the inventory item
    const item = await InventoryItem.findById(body.itemId)
    if (!item) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Inventory item not found', null, 404),
        { status: 404 }
      )
    }

    // System stock is the current stock in the item
    const systemStock = item.currentStock
    const physicalStock = parseFloat(body.physicalStock)

    // Create reconciliation record
    const reconciliation = await Reconciliation.create({
      item: {
        id: item._id,
        itemCode: item.itemCode,
        name: item.name,
      },
      systemStock,
      physicalStock,
      discrepancy: 0, // Will be calculated by pre-save hook
      discrepancyPercentage: 0, // Will be calculated by pre-save hook
      unit: item.unit,
      reconciliationDate: body.reconciliationDate || new Date(),
      location: body.location,
      reason: body.reason,
      notes: body.notes,
      performedBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      status: body.status || 'DRAFT',
    })

    // If auto-adjust is enabled and status is APPROVED, create adjustment movement
    if (body.autoAdjust && body.status === 'APPROVED' && reconciliation.discrepancy !== 0) {
      const movementType = reconciliation.discrepancy > 0 ? 'IN' : 'OUT'
      const quantity = Math.abs(reconciliation.discrepancy)

      const movement = await StockMovement.create({
        item: {
          id: item._id,
          itemCode: item.itemCode,
          name: item.name,
        },
        movementType: 'ADJUSTMENT',
        quantity: reconciliation.discrepancy, // Can be positive or negative
        unit: item.unit,
        referenceType: 'RECONCILIATION',
        referenceId: reconciliation._id,
        referenceNumber: `REC-${reconciliation._id.toString().slice(-8).toUpperCase()}`,
        stockBefore: systemStock,
        stockAfter: physicalStock,
        reason: `Stock reconciliation adjustment - ${reconciliation.reason || 'Physical count'}`,
        notes: body.notes,
        performedBy: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        status: 'COMPLETED',
        transactionDate: body.reconciliationDate || new Date(),
      })

      // Update inventory item stock
      item.currentStock = physicalStock
      await item.save()

      // Update reconciliation with adjustment reference
      reconciliation.adjustmentReference = {
        movementId: movement._id,
        movementType: 'ADJUSTMENT',
        adjustmentApplied: true,
      }
      reconciliation.status = 'COMPLETED'
      await reconciliation.save()
    }

    return NextResponse.json(successResponse(reconciliation), { status: 201 })
  } catch (error: any) {
    console.error('Create reconciliation error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        validationError(error.message, error.errors),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to create reconciliation', null, 500),
      { status: 500 }
    )
  }
}
