import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import PurchaseDemand from '@/lib/db/models/PurchaseDemand'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/procurement/demands - Get all purchase demands with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const generationType = searchParams.get('generationType')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = { isDeleted: false }

    if (status) {
      query.finalStatus = status
    }

    if (generationType) {
      query.generationType = generationType
    }

    // Search by demand number or notes
    if (search) {
      query.$or = [
        { demandNumber: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { 'createdBy.name': { $regex: search, $options: 'i' } },
      ]
    }

    // Execute query with pagination
    const [demands, total] = await Promise.all([
      PurchaseDemand.find(query)
        .sort({ demandDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PurchaseDemand.countDocuments(query),
    ])

    return NextResponse.json(
      successResponse(demands, {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    )
  } catch (error: any) {
    console.error('Get demands error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch demands', null, 500),
      { status: 500 }
    )
  }
}

/**
 * POST /api/procurement/demands - Create new purchase demand
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.demandNumber || !body.requiredByDate || !body.items || body.items.length === 0) {
      return NextResponse.json(
        validationError('Demand number, required by date, and at least one item are required'),
        { status: 400 }
      )
    }

    await connectDB()

    // Check if demand number already exists
    const existingDemand = await PurchaseDemand.findOne({
      demandNumber: body.demandNumber.toUpperCase(),
      isDeleted: false,
    })

    if (existingDemand) {
      return NextResponse.json(
        validationError('Demand number already exists'),
        { status: 400 }
      )
    }

    // Create demand
    const demand = await PurchaseDemand.create({
      demandNumber: body.demandNumber.toUpperCase(),
      demandDate: body.demandDate || new Date(),
      requiredByDate: new Date(body.requiredByDate),
      generationType: body.generationType || 'MANUAL',
      basedOnCommitments: body.basedOnCommitments,
      items: body.items,
      createdBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      approvalWorkflow: body.approvalWorkflow || [],
      finalStatus: body.finalStatus || 'DRAFT',
      notes: body.notes,
    })

    return NextResponse.json(successResponse(demand), { status: 201 })
  } catch (error: any) {
    console.error('Create demand error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        validationError(error.message, error.errors),
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        validationError('Demand number already exists'),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to create demand', null, 500),
      { status: 500 }
    )
  }
}
