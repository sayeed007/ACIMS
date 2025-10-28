import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose';
import Reconciliation from '@/lib/db/models/Reconciliation'
import InventoryItem from '@/lib/db/models/InventoryItem'
import StockMovement from '@/lib/db/models/StockMovement'
import { successResponse, errorResponse, notFoundError, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/inventory/reconciliations/:id - Get single reconciliation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const reconciliation = await Reconciliation.findOne({
      _id: params.id,
      isDeleted: false,
    }).lean()

    if (!reconciliation) {
      return NextResponse.json(
        notFoundError('Reconciliation not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(reconciliation))
  } catch (error: any) {
    console.error('Get reconciliation error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch reconciliation', null, 500),
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inventory/reconciliations/:id - Update reconciliation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()
    await connectDB()

    // Find the reconciliation
    const reconciliation = await Reconciliation.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!reconciliation) {
      return NextResponse.json(
        notFoundError('Reconciliation not found'),
        { status: 404 }
      )
    }

    // Only allow updating certain fields based on status
    if (reconciliation.status === 'DRAFT' || reconciliation.status === 'SUBMITTED') {
      if (body.physicalStock !== undefined) {
        reconciliation.physicalStock = body.physicalStock
        // Discrepancy will be recalculated by pre-save hook
      }
      if (body.location !== undefined) {
        reconciliation.location = body.location
      }
      if (body.reason !== undefined) {
        reconciliation.reason = body.reason
      }
      if (body.notes !== undefined) {
        reconciliation.notes = body.notes
      }
    }

    // Handle status changes
    if (body.status !== undefined) {
      reconciliation.status = body.status
    }

    // Handle verification
    if (body.verify === true && reconciliation.status === 'SUBMITTED') {
      reconciliation.status = 'VERIFIED'
      reconciliation.verifiedBy = {
        id: user._id,
        name: user.name,
        email: user.email,
        verifiedAt: new Date(),
      }
    }

    // Handle approval
    if (body.approve === true && reconciliation.status === 'VERIFIED') {
      reconciliation.status = 'APPROVED'
      reconciliation.approvedBy = {
        id: user._id,
        name: user.name,
        email: user.email,
        approvedAt: new Date(),
      }

      // Apply adjustment if not already applied
      if (!reconciliation.adjustmentReference?.adjustmentApplied && reconciliation.discrepancy !== 0) {
        const item = await InventoryItem.findById(reconciliation.item.id)
        if (!item) {
          return NextResponse.json(
            errorResponse('NOT_FOUND', 'Inventory item not found', null, 404),
            { status: 404 }
          )
        }

        // Create adjustment movement
        const movement = await StockMovement.create({
          item: {
            id: item._id,
            itemCode: item.itemCode,
            name: item.name,
          },
          movementType: 'ADJUSTMENT',
          quantity: reconciliation.discrepancy,
          unit: item.unit,
          referenceType: 'RECONCILIATION',
          referenceId: reconciliation._id,
          referenceNumber: `REC-${reconciliation._id.toString().slice(-8).toUpperCase()}`,
          stockBefore: reconciliation.systemStock,
          stockAfter: reconciliation.physicalStock,
          reason: `Stock reconciliation adjustment - ${reconciliation.reason || 'Physical count'}`,
          notes: reconciliation.notes,
          performedBy: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          status: 'COMPLETED',
          transactionDate: reconciliation.reconciliationDate,
        })

        // Update inventory item stock
        item.currentStock = reconciliation.physicalStock
        await item.save()

        // Update reconciliation with adjustment reference
        reconciliation.adjustmentReference = {
          movementId: movement._id,
          movementType: 'ADJUSTMENT',
          adjustmentApplied: true,
        }
        reconciliation.status = 'COMPLETED'
      }
    }

    // Handle rejection
    if (body.reject === true) {
      reconciliation.status = 'REJECTED'
    }

    await reconciliation.save()

    return NextResponse.json(successResponse(reconciliation))
  } catch (error: any) {
    console.error('Update reconciliation error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update reconciliation', null, 500),
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inventory/reconciliations/:id - Soft delete reconciliation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const reconciliation = await Reconciliation.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!reconciliation) {
      return NextResponse.json(
        notFoundError('Reconciliation not found'),
        { status: 404 }
      )
    }

    // Only allow deleting draft or rejected reconciliations
    if (reconciliation.status !== 'DRAFT' && reconciliation.status !== 'REJECTED') {
      return NextResponse.json(
        validationError('Cannot delete reconciliation in current status'),
        { status: 400 }
      )
    }

    // Mark as deleted (soft delete)
    reconciliation.isDeleted = true
    await reconciliation.save()

    return NextResponse.json(successResponse({ message: 'Reconciliation deleted successfully' }))
  } catch (error: any) {
    console.error('Delete reconciliation error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete reconciliation', null, 500),
      { status: 500 }
    )
  }
}
