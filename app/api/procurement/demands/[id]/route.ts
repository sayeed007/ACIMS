import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseDemand from '@/lib/db/models/PurchaseDemand'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/procurement/demands/[id] - Get single demand
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const demand = await PurchaseDemand.findOne({
      _id: params.id,
      isDeleted: false,
    }).lean()

    if (!demand) {
      return errorResponse('NOT_FOUND', 'Demand not found', null, 404)
    }

    return successResponse(demand)
  } catch (error: any) {
    console.error('Get demand error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch demand', null, 500)
  }
}

/**
 * PUT /api/procurement/demands/[id] - Update demand
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const body = await request.json()

    await connectDB()

    const demand = await PurchaseDemand.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!demand) {
      return errorResponse('NOT_FOUND', 'Demand not found', null, 404)
    }

    // Update fields
    if (body.requiredByDate) demand.requiredByDate = new Date(body.requiredByDate)
    if (body.items) demand.items = body.items
    if (body.approvalWorkflow) demand.approvalWorkflow = body.approvalWorkflow
    if (body.finalStatus) demand.finalStatus = body.finalStatus
    if (body.purchaseOrderReference) demand.purchaseOrderReference = body.purchaseOrderReference
    if (body.notes !== undefined) demand.notes = body.notes
    if (body.basedOnCommitments) demand.basedOnCommitments = body.basedOnCommitments

    await demand.save()

    return successResponse(demand)
  } catch (error: any) {
    console.error('Update demand error:', error)

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to update demand', null, 500)
  }
}

/**
 * DELETE /api/procurement/demands/[id] - Soft delete demand
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const demand = await PurchaseDemand.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!demand) {
      return errorResponse('NOT_FOUND', 'Demand not found', null, 404)
    }

    // Soft delete
    demand.isDeleted = true
    await demand.save()

    return successResponse({ message: 'Demand deleted successfully' })
  } catch (error: any) {
    console.error('Delete demand error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete demand', null, 500)
  }
}
