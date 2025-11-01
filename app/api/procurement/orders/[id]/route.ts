import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const { id } = await params
    await connectDB()
    const po = await PurchaseOrder.findOne({ _id: id, isDeleted: false }).lean()
    if (!po) return errorResponse('NOT_FOUND', 'PO not found', null, 404)

    return successResponse(po)
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const { id } = await params
    const body = await request.json()
    await connectDB()

    const po = await PurchaseOrder.findOne({ _id: id, isDeleted: false })
    if (!po) return errorResponse('NOT_FOUND', 'PO not found', null, 404)

    Object.assign(po, body)
    await po.save()

    return successResponse(po)
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const { id } = await params
    await connectDB()
    const po = await PurchaseOrder.findOne({ _id: id, isDeleted: false })
    if (!po) return errorResponse('NOT_FOUND', 'PO not found', null, 404)

    po.isDeleted = true
    await po.save()

    return successResponse({ message: 'PO deleted successfully' })
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}
