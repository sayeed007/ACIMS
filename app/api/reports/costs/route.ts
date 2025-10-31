import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import MealTransaction from '@/lib/db/models/MealTransaction'
import StockMovement from '@/lib/db/models/StockMovement'
import Bill from '@/lib/db/models/Bill'
import PurchaseOrder from '@/lib/db/models/PurchaseOrder'
import { successResponse, errorResponse } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/reports/costs - Get comprehensive cost analysis reports
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

    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    // Meal costs over time
    const mealCostTrend = await MealTransaction.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCost: { $sum: '$cost' },
          mealCount: { $sum: 1 },
          avgCost: { $avg: '$cost' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Procurement costs
    const procurementCosts = await PurchaseOrder.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$poDate' } },
          totalAmount: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Vendor-wise spending
    const vendorSpending = await PurchaseOrder.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$vendor.id',
          vendorName: { $first: '$vendor.name' },
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ])

    // Bills payment status
    const billsAnalysis = await Bill.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          balanceAmount: { $sum: '$balanceAmount' },
        },
      },
    ])

    // Department-wise meal costs
    const departmentCosts = await MealTransaction.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: '$employee.department',
          totalCost: { $sum: '$cost' },
          mealCount: { $sum: 1 },
          avgCostPerMeal: { $avg: '$cost' },
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
          totalCost: 1,
          mealCount: 1,
          avgCostPerMeal: 1,
          departmentName: { $arrayElemAt: ['$deptInfo.name', 0] },
        },
      },
      { $sort: { totalCost: -1 } },
    ])

    // Inventory consumption costs
    const inventoryCosts = await StockMovement.aggregate([
      {
        $match: {
          isDeleted: false,
          movementType: 'OUT',
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalCost: { $sum: '$totalCost' },
          totalQuantity: { $sum: '$quantity' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Cost per meal calculation
    const costPerMeal = await MealTransaction.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          totalCost: { $sum: '$cost' },
        },
      },
      {
        $project: {
          _id: 0,
          totalMeals: 1,
          totalCost: 1,
          costPerMeal: { $divide: ['$totalCost', '$totalMeals'] },
        },
      },
    ])

    // Monthly comparison
    const monthlyComparison = await MealTransaction.aggregate([
      { $match: { isDeleted: false, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalCost: { $sum: '$cost' },
          mealCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ])

    return NextResponse.json(
      successResponse({
        mealCostTrend,
        procurementCosts,
        vendorSpending,
        billsAnalysis,
        departmentCosts,
        inventoryCosts,
        costPerMeal: costPerMeal[0] || { totalMeals: 0, totalCost: 0, costPerMeal: 0 },
        monthlyComparison,
        filters: {
          startDate,
          endDate,
        },
      })
    )
  } catch (error: any) {
    console.error('Get cost reports error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch reports', null, 500),
      { status: 500 }
    )
  }
}
