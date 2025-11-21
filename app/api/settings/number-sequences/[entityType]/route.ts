import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'
import { updateSequenceConfig, resetSequence, getSequenceConfig, EntityType } from '@/lib/utils/number-sequence'

/**
 * GET /api/settings/number-sequences/:entityType - Get specific sequence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied', null, 403)
    }

    const { entityType } = await params

    const sequence = await getSequenceConfig(entityType as EntityType)

    if (!sequence) {
      return errorResponse('NOT_FOUND', 'Number sequence not found', null, 404)
    }

    return successResponse(sequence)
  } catch (error: any) {
    console.error('Get number sequence error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch number sequence', null, 500)
  }
}

/**
 * PUT /api/settings/number-sequences/:entityType - Update sequence configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied', null, 403)
    }

    const { entityType } = await params
    const body = await request.json()

    // Validate updates
    const allowedFields = ['prefix', 'length', 'format', 'description', 'isActive']
    const updates: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (updates.length !== undefined && (updates.length < 3 || updates.length > 10)) {
      return validationError('Length must be between 3 and 10')
    }

    if (updates.prefix !== undefined && updates.prefix.trim().length === 0) {
      return validationError('Prefix cannot be empty')
    }

    const sequence = await updateSequenceConfig(entityType as EntityType, updates)

    return successResponse(sequence, 'Number sequence updated successfully')
  } catch (error: any) {
    console.error('Update number sequence error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to update number sequence', null, 500)
  }
}

/**
 * PATCH /api/settings/number-sequences/:entityType - Reset sequence
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    // Only super admins can reset sequences
    if (user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied', null, 403)
    }

    const { entityType } = await params
    const body = await request.json()

    const resetTo = body.resetTo !== undefined ? parseInt(body.resetTo) : 0

    if (isNaN(resetTo) || resetTo < 0) {
      return validationError('Reset value must be a non-negative number')
    }

    const sequence = await resetSequence(entityType as EntityType, resetTo)

    return successResponse(sequence, `Sequence reset to ${resetTo} successfully`)
  } catch (error: any) {
    console.error('Reset number sequence error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to reset number sequence', null, 500)
  }
}
