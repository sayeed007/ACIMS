import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()
    const po = await PurchaseOrder.findOne({ _id: params.id, isDeleted: false }).lean()
    if (!po) return NextResponse.json(errorResponse('NOT_FOUND', 'PO not found', null, 404), { status: 404 })

    return NextResponse.json(successResponse(po))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    const body = await request.json()
    await connectDB()

    const po = await PurchaseOrder.findOne({ _id: params.id, isDeleted: false })
    if (!po) return NextResponse.json(errorResponse('NOT_FOUND', 'PO not found', null, 404), { status: 404 })

    Object.assign(po, body)
    await po.save()

    return NextResponse.json(successResponse(po))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()
    const po = await PurchaseOrder.findOne({ _id: params.id, isDeleted: false })
    if (!po) return NextResponse.json(errorResponse('NOT_FOUND', 'PO not found', null, 404), { status: 404 })

    po.isDeleted = true
    await po.save()

    return NextResponse.json(successResponse({ message: 'PO deleted successfully' }))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}
