import { NextRequest } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import AccessControlRule from '@/lib/db/models/AccessControlRule'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    await connectDB()
    const role = await AccessControlRule.findOne({ _id: params.id, isDeleted: false }).lean()
    if (!role) return errorResponse('NOT_FOUND', 'Role not found', null, 404)

    return successResponse(role)
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    const body = await request.json()
    await connectDB()

    const role = await AccessControlRule.findOne({ _id: params.id, isDeleted: false })
    if (!role) return errorResponse('NOT_FOUND', 'Role not found', null, 404)

    if (role.isSystemRole) {
      return errorResponse('FORBIDDEN', 'Cannot modify system role', null, 403)
    }

    Object.assign(role, body)
    await role.save()

    return successResponse(role)
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser()
    if (!user) return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)

    await connectDB()
    const role = await AccessControlRule.findOne({ _id: params.id, isDeleted: false })
    if (!role) return errorResponse('NOT_FOUND', 'Role not found', null, 404)

    if (role.isSystemRole) {
      return errorResponse('FORBIDDEN', 'Cannot delete system role', null, 403)
    }

    role.isDeleted = true
    await role.save()

    return successResponse({ message: 'Role deleted successfully' })
  } catch (error: any) {
    return errorResponse('INTERNAL_ERROR', error.message, null, 500)
  }
}
