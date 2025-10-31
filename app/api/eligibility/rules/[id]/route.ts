import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import EligibilityRule from '@/lib/db/models/EligibilityRule'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/eligibility/rules/[id] - Get single eligibility rule
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const rule = await EligibilityRule.findOne({
      _id: params.id,
      isDeleted: false,
    }).lean()

    if (!rule) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Rule not found', null, 404),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(rule))
  } catch (error: any) {
    console.error('Get eligibility rule error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch rule', null, 500),
      { status: 500 }
    )
  }
}

/**
 * PUT /api/eligibility/rules/[id] - Update eligibility rule
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()

    await connectDB()

    const rule = await EligibilityRule.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!rule) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Rule not found', null, 404),
        { status: 404 }
      )
    }

    // Update fields
    Object.assign(rule, body)
    await rule.save()

    return NextResponse.json(successResponse(rule))
  } catch (error: any) {
    console.error('Update eligibility rule error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update rule', null, 500),
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/eligibility/rules/[id] - Soft delete eligibility rule
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const rule = await EligibilityRule.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!rule) {
      return NextResponse.json(
        errorResponse('NOT_FOUND', 'Rule not found', null, 404),
        { status: 404 }
      )
    }

    // Soft delete
    rule.isDeleted = true
    await rule.save()

    return NextResponse.json(
      successResponse({ message: 'Rule deleted successfully' })
    )
  } catch (error: any) {
    console.error('Delete eligibility rule error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete rule', null, 500),
      { status: 500 }
    )
  }
}
