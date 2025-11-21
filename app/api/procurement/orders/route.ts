import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'
import { generateNextNumber } from '@/lib/utils/number-sequence'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
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

    return successResponse(orders, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error: any) {
    console.error('Get purchase orders error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch orders', null, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const body = await request.json()

    if (!body.vendor || !body.deliveryDate || !body.items || body.items.length === 0) {
      return validationError('Vendor, delivery date, and items are required')
    }

    await connectDB()

    // Auto-generate PO number if not provided
    let poNumber = body.poNumber
    if (!poNumber || poNumber.trim() === '') {
      try {
        poNumber = await generateNextNumber('PURCHASE_ORDER')
      } catch (error: any) {
        return errorResponse('INTERNAL_ERROR', `Failed to generate PO number: ${error.message}`, null, 500)
      }
    } else {
      // If manual number provided, check for duplicates
      poNumber = poNumber.toUpperCase()
      const existingPO = await PurchaseOrder.findOne({ poNumber, isDeleted: false })
      if (existingPO) {
        return validationError('PO number already exists')
      }
    }

    const po = await PurchaseOrder.create({
      ...body,
      poNumber,
      createdBy: { id: user._id, name: user.name, email: user.email },
    })

    return successResponse(po)
  } catch (error: any) {
    console.error('Create PO error:', error)
    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to create PO', null, 500)
  }
}
