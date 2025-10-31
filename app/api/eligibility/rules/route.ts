import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import EligibilityRule from '@/lib/db/models/EligibilityRule'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/eligibility/rules - Get all eligibility rules with filtering
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
    const mealSessionId = searchParams.get('mealSessionId')
    const shiftId = searchParams.get('shiftId')
    const departmentId = searchParams.get('departmentId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = { isDeleted: false }

    if (mealSessionId) {
      query['mealSession.id'] = mealSessionId
    }

    if (shiftId) {
      query['applicableFor.shifts'] = shiftId
    }

    if (departmentId) {
      query['applicableFor.departments'] = departmentId
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    // Search by rule name or description
    if (search) {
      query.$or = [
        { ruleName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'mealSession.name': { $regex: search, $options: 'i' } },
      ]
    }

    // Execute query with pagination
    const [rules, total] = await Promise.all([
      EligibilityRule.find(query)
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EligibilityRule.countDocuments(query),
    ])

    return NextResponse.json(
      successResponse(rules, {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    )
  } catch (error: any) {
    console.error('Get eligibility rules error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch rules', null, 500),
      { status: 500 }
    )
  }
}

/**
 * POST /api/eligibility/rules - Create new eligibility rule
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
    if (!body.ruleName || !body.mealSession) {
      return NextResponse.json(
        validationError('Rule name and meal session are required'),
        { status: 400 }
      )
    }

    await connectDB()

    // Create rule
    const rule = await EligibilityRule.create({
      ...body,
      createdBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })

    return NextResponse.json(successResponse(rule), { status: 201 })
  } catch (error: any) {
    console.error('Create eligibility rule error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        validationError(error.message, error.errors),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to create rule', null, 500),
      { status: 500 }
    )
  }
}
