import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const query: any = { isDeleted: false }

    if (status) query.status = status
    if (vendorId) query['vendor.id'] = vendorId
    if (search) {
      query.$or = [
        { poNumber: { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } },
      ]
    }

    const [orders, total] = await Promise.all([
      PurchaseOrder.find(query).sort({ poDate: -1 }).skip(skip).limit(limit).lean(),
      PurchaseOrder.countDocuments(query),
    ])

    return NextResponse.json(successResponse(orders, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }))
  } catch (error: any) {
    console.error('Get purchase orders error:', error)
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch orders', null, 500), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })
    }

    const body = await request.json()

    if (!body.poNumber || !body.vendor || !body.deliveryDate || !body.items || body.items.length === 0) {
      return NextResponse.json(validationError('PO number, vendor, delivery date, and items are required'), { status: 400 })
    }

    await connectDB()

    const existingPO = await PurchaseOrder.findOne({ poNumber: body.poNumber.toUpperCase(), isDeleted: false })
    if (existingPO) {
      return NextResponse.json(validationError('PO number already exists'), { status: 400 })
    }

    const po = await PurchaseOrder.create({
      ...body,
      poNumber: body.poNumber.toUpperCase(),
      createdBy: { id: user._id, name: user.name, email: user.email },
    })

    return NextResponse.json(successResponse(po), { status: 201 })
  } catch (error: any) {
    console.error('Create PO error:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json(validationError(error.message, error.errors), { status: 400 })
    }
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message || 'Failed to create PO', null, 500), { status: 500 })
  }
}
