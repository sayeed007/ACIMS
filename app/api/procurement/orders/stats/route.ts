import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()

    const [total, draft, approved, sentToVendor, partiallyReceived, fullyReceived] = await Promise.all([
      PurchaseOrder.countDocuments({ isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'DRAFT', isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'APPROVED', isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'SENT_TO_VENDOR', isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'PARTIALLY_RECEIVED', isDeleted: false }),
      PurchaseOrder.countDocuments({ status: 'FULLY_RECEIVED', isDeleted: false }),
    ])

    return NextResponse.json(successResponse({ total, draft, approved, sentToVendor, partiallyReceived, fullyReceived, pending: draft + approved }))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}
