import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseDemand from '@/lib/db/models/PurchaseDemand'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/procurement/demands/stats - Get demand statistics
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const [
      total,
      draft,
      submitted,
      approved,
      rejected,
      poCreated
    ] = await Promise.all([
      PurchaseDemand.countDocuments({ isDeleted: false }),
      PurchaseDemand.countDocuments({ finalStatus: 'DRAFT', isDeleted: false }),
      PurchaseDemand.countDocuments({ finalStatus: 'SUBMITTED', isDeleted: false }),
      PurchaseDemand.countDocuments({ finalStatus: 'APPROVED', isDeleted: false }),
      PurchaseDemand.countDocuments({ finalStatus: 'REJECTED', isDeleted: false }),
      PurchaseDemand.countDocuments({ finalStatus: 'PO_CREATED', isDeleted: false }),
    ])

    const stats = {
      total,
      draft,
      submitted,
      approved,
      rejected,
      poCreated,
      pending: submitted + approved, // Demands that need action
    }

    return successResponse(stats)
  } catch (error: any) {
    console.error('Get demand stats error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch stats', null, 500)
  }
}
