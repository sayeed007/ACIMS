import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { MealSession } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import * as XLSX from 'xlsx';

/**
 * GET /api/meals/sessions/export
 * Export meal sessions to Excel
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const mealType = searchParams.get('mealType');

    // Build query
    const query: any = { isDeleted: false };

    if (status) {
      query.status = status;
    }

    if (mealType) {
      query.mealType = mealType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch meal sessions
    const sessions = await MealSession.find(query)
      .populate('eligibleShifts', 'name code')
      .populate('allowedDepartments', 'name code')
      .sort({ displayOrder: 1, startTime: 1 })
      .lean();

    // Prepare data for Excel
    const exportData = sessions.map((session: any, index: number) => ({
      '#': index + 1,
      'Session Code': session.code,
      'Session Name': session.name,
      'Description': session.description || '-',
      'Meal Type': session.mealType?.replace('_', ' ') || '-',
      'Start Time': session.startTime,
      'End Time': session.endTime,
      'Display Order': session.displayOrder || 0,
      'Max Capacity': session.maxCapacity || 'Unlimited',
      'Is Overtime Meal': session.isOvertimeMeal ? 'Yes' : 'No',
      'Eligible Shifts': session.eligibleShifts?.map((s: any) => s.code).join(', ') || '-',
      'Allowed Departments': session.allowedDepartments?.map((d: any) => d.code).join(', ') || '-',
      'Status': session.status,
      'Created At': session.createdAt ? new Date(session.createdAt).toLocaleDateString() : '-',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 15 }, // Code
      { wch: 25 }, // Name
      { wch: 30 }, // Description
      { wch: 18 }, // Meal Type
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 15 }, // Display Order
      { wch: 15 }, // Max Capacity
      { wch: 18 }, // Is Overtime Meal
      { wch: 25 }, // Eligible Shifts
      { wch: 25 }, // Allowed Departments
      { wch: 12 }, // Status
      { wch: 15 }, // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Meal Sessions');

    // Create summary sheet
    const mealTypeCounts: any = {};
    sessions.forEach((s: any) => {
      const type = s.mealType || 'UNKNOWN';
      mealTypeCounts[type] = (mealTypeCounts[type] || 0) + 1;
    });

    const summaryData = [
      { Metric: 'Total Sessions', Value: sessions.length },
      { Metric: 'Active Sessions', Value: sessions.filter((s: any) => s.status === 'ACTIVE').length },
      { Metric: 'Inactive Sessions', Value: sessions.filter((s: any) => s.status === 'INACTIVE').length },
      ...Object.entries(mealTypeCounts).map(([type, count]) => ({
        Metric: `${type.replace('_', ' ')} Sessions`,
        Value: count,
      })),
      { Metric: 'Export Date', Value: new Date().toLocaleString() },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="meal_sessions_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export meal sessions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to export meal sessions' },
      },
      { status: 500 }
    );
  }
}
