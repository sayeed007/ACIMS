import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Bill from '@/lib/db/models/Bill'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const { id } = await params
    await connectDB()
    const bill = await Bill.findOne({ _id: id, isDeleted: false }).lean()
    if (!bill) return errorResponse('NOT_FOUND', 'Bill not found', null, 404)

    return successResponse(bill)
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

    const bill = await Bill.findOne({ _id: id, isDeleted: false })
    if (!bill) return errorResponse('NOT_FOUND', 'Bill not found', null, 404)

    Object.assign(bill, body)
    await bill.save()

    return successResponse(bill)
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
    const bill = await Bill.findOne({ _id: id, isDeleted: false })
    if (!bill) return errorResponse('NOT_FOUND', 'Bill not found', null, 404)

    bill.isDeleted = true
    await bill.save()

    return successResponse({ message: 'Bill deleted successfully' })
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}
