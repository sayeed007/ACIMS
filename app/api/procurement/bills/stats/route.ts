import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Bill from '@/lib/db/models/Bill'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()

    const [total, unpaid, partiallyPaid, fullyPaid, draft, approved] = await Promise.all([
      Bill.countDocuments({ isDeleted: false }),
      Bill.countDocuments({ paymentStatus: 'UNPAID', isDeleted: false }),
      Bill.countDocuments({ paymentStatus: 'PARTIALLY_PAID', isDeleted: false }),
      Bill.countDocuments({ paymentStatus: 'FULLY_PAID', isDeleted: false }),
      Bill.countDocuments({ status: 'DRAFT', isDeleted: false }),
      Bill.countDocuments({ status: 'APPROVED', isDeleted: false }),
    ])

    const totalPayable = await Bill.aggregate([
      { $match: { isDeleted: false, paymentStatus: { $ne: 'FULLY_PAID' } } },
      { $group: { _id: null, total: { $sum: '$balanceAmount' } } },
    ])

    return NextResponse.json(successResponse({
      total,
      unpaid,
      partiallyPaid,
      fullyPaid,
      draft,
      approved,
      pendingPayments: unpaid + partiallyPaid,
      totalOutstanding: totalPayable[0]?.total || 0,
    }))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}
