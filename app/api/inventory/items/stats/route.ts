import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * GET /api/inventory/items/stats
 * Get inventory statistics (aggregated on server side for performance)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
    }

    await connectDB();

    // Use MongoDB aggregation for efficient calculation
    const [stats] = await InventoryItem.aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          lowStock: [
            {
              $match: {
                $expr: { $lte: ['$currentStock', '$reorderLevel'] },
              },
            },
            { $count: 'count' },
          ],
          totalValue: [
            {
              $group: {
                _id: null,
                value: { $sum: '$totalValue' },
              },
            },
          ],
        },
      },
      {
        $project: {
          total: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
          lowStock: { $ifNull: [{ $arrayElemAt: ['$lowStock.count', 0] }, 0] },
          totalValue: { $ifNull: [{ $arrayElemAt: ['$totalValue.value', 0] }, 0] },
        },
      },
    ]);

    return successResponse(stats || { total: 0, lowStock: 0, totalValue: 0 });
  } catch (error: any) {
    console.error('Get inventory stats error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      error.message || 'Failed to fetch inventory statistics',
      null,
      500
    );
  }
}
