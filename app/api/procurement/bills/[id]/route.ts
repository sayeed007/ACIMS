import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import Bill from '@/lib/db/models/Bill'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()
    const bill = await Bill.findOne({ _id: params.id, isDeleted: false }).lean()
    if (!bill) return NextResponse.json(errorResponse('NOT_FOUND', 'Bill not found', null, 404), { status: 404 })

    return NextResponse.json(successResponse(bill))
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

    const bill = await Bill.findOne({ _id: params.id, isDeleted: false })
    if (!bill) return NextResponse.json(errorResponse('NOT_FOUND', 'Bill not found', null, 404), { status: 404 })

    Object.assign(bill, body)
    await bill.save()

    return NextResponse.json(successResponse(bill))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()
    const bill = await Bill.findOne({ _id: params.id, isDeleted: false })
    if (!bill) return NextResponse.json(errorResponse('NOT_FOUND', 'Bill not found', null, 404), { status: 404 })

    bill.isDeleted = true
    await bill.save()

    return NextResponse.json(successResponse({ message: 'Bill deleted successfully' }))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}
