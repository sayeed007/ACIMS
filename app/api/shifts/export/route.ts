import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Shift } from '@/lib/db/models';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import * as XLSX from 'xlsx';

/**
 * GET /api/shifts/export
 * Export shifts to Excel
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

    // Build query
    const query: any = { isDeleted: false };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Fetch shifts
    const shifts = await Shift.find(query)
      .sort({ name: 1 })
      .lean();

    // Prepare data for Excel
    const exportData = shifts.map((shift: any, index: number) => ({
      '#': index + 1,
      'Shift Code': shift.code,
      'Shift Name': shift.name,
      'Description': shift.description || '-',
      'Start Time': shift.startTime,
      'End Time': shift.endTime,
      'Grace Period (min)': shift.gracePeriod || 0,
      'Breakfast Eligible': shift.mealEligibility?.breakfast ? 'Yes' : 'No',
      'Lunch Eligible': shift.mealEligibility?.lunch ? 'Yes' : 'No',
      'Dinner Eligible': shift.mealEligibility?.dinner ? 'Yes' : 'No',
      'Snacks Eligible': shift.mealEligibility?.snacks ? 'Yes' : 'No',
      'Overtime Threshold (hrs)': shift.overtimeThreshold || '-',
      'Status': shift.status,
      'Created At': shift.createdAt ? new Date(shift.createdAt).toLocaleDateString() : '-',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 12 }, // Code
      { wch: 20 }, // Name
      { wch: 30 }, // Description
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 18 }, // Grace Period
      { wch: 18 }, // Breakfast
      { wch: 15 }, // Lunch
      { wch: 15 }, // Dinner
      { wch: 15 }, // Snacks
      { wch: 22 }, // Overtime Threshold
      { wch: 12 }, // Status
      { wch: 15 }, // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shifts');

    // Create summary sheet
    const summaryData = [
      { Metric: 'Total Shifts', Value: shifts.length },
      { Metric: 'Active Shifts', Value: shifts.filter((s: any) => s.status === 'ACTIVE').length },
      { Metric: 'Inactive Shifts', Value: shifts.filter((s: any) => s.status === 'INACTIVE').length },
      { Metric: 'Export Date', Value: new Date().toLocaleString() },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="shifts_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export shifts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to export shifts' },
      },
      { status: 500 }
    );
  }
}
