import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import EligibilityRule from '@/lib/db/models/EligibilityRule'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/eligibility/rules/stats - Get eligibility rules statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const [total, active, inactive] = await Promise.all([
      EligibilityRule.countDocuments({ isDeleted: false }),
      EligibilityRule.countDocuments({ isActive: true, isDeleted: false }),
      EligibilityRule.countDocuments({ isActive: false, isDeleted: false }),
    ])

    const stats = {
      total,
      active,
      inactive,
    }

    return successResponse(stats)
  } catch (error: any) {
    console.error('Get eligibility rules stats error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch stats', null, 500)
  }
}
