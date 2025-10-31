import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import AccessControlRule from '@/lib/db/models/AccessControlRule'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    await connectDB()

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const query: any = { isDeleted: false }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    if (search) {
      query.$or = [
        { roleName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const [roles, total] = await Promise.all([
      AccessControlRule.find(query).sort({ roleName: 1 }).skip(skip).limit(limit).lean(),
      AccessControlRule.countDocuments(query),
    ])

    return NextResponse.json(successResponse(roles, { pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }))
  } catch (error: any) {
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Authentication required', null, 401), { status: 401 })

    const body = await request.json()

    if (!body.roleName) {
      return NextResponse.json(validationError('Role name is required'), { status: 400 })
    }

    await connectDB()

    const existingRole = await AccessControlRule.findOne({ roleName: body.roleName, isDeleted: false })
    if (existingRole) {
      return NextResponse.json(validationError('Role name already exists'), { status: 400 })
    }

    const role = await AccessControlRule.create({
      ...body,
      createdBy: { id: user._id, name: user.name, email: user.email },
    })

    return NextResponse.json(successResponse(role), { status: 201 })
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(validationError(error.message, error.errors), { status: 400 })
    }
    return NextResponse.json(errorResponse('INTERNAL_ERROR', error.message, null, 500), { status: 500 })
  }
}
