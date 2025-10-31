import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import AuditLog from '@/lib/db/models/AuditLog'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/reports/audit - Get audit logs with filtering
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')
    const module = searchParams.get('module')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const query: any = {}

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (action) {
      query.action = action
    }

    if (module) {
      query.module = module
    }

    if (userId) {
      query['user.id'] = userId
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ])

    // Get statistics
    const stats = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
        },
      },
    ])

    const actionsByModule = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$module',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])

    const topUsers = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$user.id',
          userName: { $first: '$user.name' },
          actionCount: { $sum: 1 },
        },
      },
      { $sort: { actionCount: -1 } },
      { $limit: 10 },
    ])

    return NextResponse.json(
      successResponse({
        logs,
        stats: {
          actionStats: stats,
          moduleStats: actionsByModule,
          topUsers,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          startDate,
          endDate,
          action,
          module,
          userId,
        },
      })
    )
  } catch (error: any) {
    console.error('Get audit logs error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch audit logs', null, 500),
      { status: 500 }
    )
  }
}
