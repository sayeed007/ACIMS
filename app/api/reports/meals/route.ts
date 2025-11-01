import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import MealTransaction from '@/lib/db/models/MealTransaction'
import MealSession from '@/lib/db/models/MealSession'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/reports/meals - Get comprehensive meal reports with aggregations
 *
 * Query params:
 * - startDate: ISO date string
 * - endDate: ISO date string
 * - mealSessionId: filter by meal session
 * - departmentId: filter by department
 * - shiftId: filter by shift
 * - groupBy: 'day' | 'session' | 'department' | 'shift'
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mealSessionId = searchParams.get('mealSessionId')
    const departmentId = searchParams.get('departmentId')
    const shiftId = searchParams.get('shiftId')
    const groupBy = searchParams.get('groupBy') || 'day'

    // Build match query
    const matchQuery: any = { isDeleted: false }

    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (mealSessionId) {
      matchQuery.mealSession = mealSessionId
    }

    if (departmentId) {
      matchQuery['employee.department'] = departmentId
    }

    if (shiftId) {
      matchQuery['employee.shift'] = shiftId
    }

    // Get total meal statistics
    const totalStats = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgCostPerMeal: { $avg: '$cost' },
        },
      },
    ])

    // Get meal breakdown by session
    const mealsBySession = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$mealSession',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgCost: { $avg: '$cost' },
        },
      },
      {
        $lookup: {
          from: 'mealsessions',
          localField: '_id',
          foreignField: '_id',
          as: 'sessionInfo',
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalCost: 1,
          avgCost: 1,
          sessionName: { $arrayElemAt: ['$sessionInfo.name', 0] },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Get daily trend
    const dailyTrend = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Get department-wise breakdown
    const mealsByDepartment = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$employee.department',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: '_id',
          foreignField: '_id',
          as: 'deptInfo',
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalCost: 1,
          departmentName: { $arrayElemAt: ['$deptInfo.name', 0] },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Get shift-wise breakdown
    const mealsByShift = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$employee.shift',
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
      {
        $lookup: {
          from: 'shifts',
          localField: '_id',
          foreignField: '_id',
          as: 'shiftInfo',
        },
      },
      {
        $project: {
          _id: 1,
          count: 1,
          totalCost: 1,
          shiftName: { $arrayElemAt: ['$shiftInfo.name', 0] },
        },
      },
      { $sort: { count: -1 } },
    ])

    // Get hourly distribution
    const hourlyDistribution = await MealTransaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    return successResponse({
      summary: totalStats[0] || { totalMeals: 0, totalCost: 0, avgCostPerMeal: 0 },
      mealsBySession,
      dailyTrend,
      mealsByDepartment,
      mealsByShift,
      hourlyDistribution,
      filters: {
        startDate,
        endDate,
        mealSessionId,
        departmentId,
        shiftId,
      },
    })
  } catch (error: any) {
    console.error('Get meal reports error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch reports', null, 500)
  }
}
