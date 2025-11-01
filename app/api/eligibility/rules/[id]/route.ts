import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import EligibilityRule from '@/lib/db/models/EligibilityRule'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/eligibility/rules/[id] - Get a single eligibility rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    await connectDB()

    const rule = await EligibilityRule.findOne({
      _id: id,
      isDeleted: false,
    }).lean()

    if (!rule) {
      return errorResponse('NOT_FOUND', 'Eligibility rule not found', null, 404)
    }

    return successResponse(rule)
  } catch (error: any) {
    console.error('Get eligibility rule error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch rule', null, 500)
  }
}

/**
 * PUT /api/eligibility/rules/[id] - Update an eligibility rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    const body = await request.json()

    // Validate required fields if being updated
    if (body.ruleName !== undefined && !body.ruleName) {
      return validationError('Rule name is required')
    }

    if (body.mealSession !== undefined && !body.mealSession) {
      return validationError('Meal session is required')
    }

    await connectDB()

    // Find existing rule
    const existingRule = await EligibilityRule.findOne({
      _id: id,
      isDeleted: false,
    })

    if (!existingRule) {
      return errorResponse('NOT_FOUND', 'Eligibility rule not found', null, 404)
    }

    // Update rule
    const updatedRule = await EligibilityRule.findByIdAndUpdate(
      id,
      {
        $set: {
          ...body,
          updatedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    ).lean()

    return successResponse(updatedRule)
  } catch (error: any) {
    console.error('Update eligibility rule error:', error)

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to update rule', null, 500)
  }
}

/**
 * DELETE /api/eligibility/rules/[id] - Soft delete an eligibility rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    await connectDB()

    // Find existing rule
    const existingRule = await EligibilityRule.findOne({
      _id: id,
      isDeleted: false,
    })

    if (!existingRule) {
      return errorResponse('NOT_FOUND', 'Eligibility rule not found', null, 404)
    }

    // Soft delete
    await EligibilityRule.findByIdAndUpdate(id, {
      $set: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    })

    return successResponse({ message: 'Eligibility rule deleted successfully' })
  } catch (error: any) {
    console.error('Delete eligibility rule error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete rule', null, 500)
  }
}
