import { NextRequest, NextResponse } from 'next/server'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'
import NumberSequence from '@/lib/db/models/NumberSequence'
import connectDB from '@/lib/db/mongoose'
import { initializeDefaultSequences } from '@/lib/utils/number-sequence'

/**
 * GET /api/settings/number-sequences - Get all number sequences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    // Only admins can view settings
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied', null, 403)
    }

    await connectDB()

    const sequences = await NumberSequence.find().sort({ entityType: 1 }).lean()

    return successResponse(sequences)
  } catch (error: any) {
    console.error('Get number sequences error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch number sequences', null, 500)
  }
}

/**
 * POST /api/settings/number-sequences - Initialize default sequences
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    // Only super admins can initialize
    if (user.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied', null, 403)
    }

    await initializeDefaultSequences()

    const sequences = await NumberSequence.find().sort({ entityType: 1 }).lean()

    return successResponse(sequences, 'Default number sequences initialized successfully')
  } catch (error: any) {
    console.error('Initialize number sequences error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to initialize number sequences', null, 500)
  }
}
