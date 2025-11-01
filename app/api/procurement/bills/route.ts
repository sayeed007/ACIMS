import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Bill from '@/lib/db/models/Bill'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const vendorId = searchParams.get('vendorId')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const query: any = { isDeleted: false }

    if (status) query.status = status
    if (paymentStatus) query.paymentStatus = paymentStatus
    if (vendorId) query['vendor.id'] = vendorId
    if (search) {
      query.$or = [
        { billNumber: { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } },
      ]
    }

    const [bills, total] = await Promise.all([
      Bill.find(query).sort({ billDate: -1 }).skip(skip).limit(limit).lean(),
      Bill.countDocuments(query),
    ])

    return successResponse(bills, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch bills', null, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const body = await request.json()

    if (!body.billNumber || !body.vendor || !body.billDate || !body.dueDate || !body.totalAmount) {
      return validationError('Bill number, vendor, dates, and amount are required')
    }

    await connectDB()

    const existingBill = await Bill.findOne({ billNumber: body.billNumber.toUpperCase(), isDeleted: false })
    if (existingBill) {
      return validationError('Bill number already exists')
    }

    const bill = await Bill.create({
      ...body,
      billNumber: body.billNumber.toUpperCase(),
      enteredBy: { id: user._id, name: user.name, email: user.email },
    })

    return successResponse(bill)
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to create bill', null, 500)
  }
}
