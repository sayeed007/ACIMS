import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import connectDB from '@/lib/db/mongoose';
import Department from '@/lib/db/models/Department';

/**
 * @route GET /api/departments/export
 * @desc Export departments to Excel
 * @access Private (ADMIN, SUPER_ADMIN, HR_ADMIN)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Check permissions
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'CANTEEN_MANAGER'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Extract query parameters for filters
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch departments
    const departments = await Department.find(query)
      .sort({ createdAt: -1 })
      .limit(1000) // Safety limit
      .lean();

    if (departments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_DATA', message: 'No departments found with the applied filters' },
        },
        { status: 404 }
      );
    }

    // Prepare data for Excel
    const exportData = departments.map((dept: any, index: number) => ({
      '#': index + 1,
      'Department Code': dept.code,
      'Department Name': dept.name,
      'Description': dept.description || '-',
      'Location': dept.location || '-',
      'Cost Center': dept.costCenter || '-',
      'Status': dept.status,
      'Created At': new Date(dept.createdAt).toLocaleString('en-US'),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 18 }, // Department Code
      { wch: 30 }, // Department Name
      { wch: 40 }, // Description
      { wch: 20 }, // Location
      { wch: 15 }, // Cost Center
      { wch: 12 }, // Status
      { wch: 20 }, // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');

    // Add summary sheet
    const summary = [
      ['Department Export Summary'],
      [''],
      ['Export Date:', new Date().toLocaleString('en-US')],
      ['Exported By:', user.name || user.email],
      ['Total Departments:', departments.length],
      [''],
      ['Filters Applied:'],
      ['Search:', search || 'None'],
      ['Status:', status || 'All'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `departments_export_${timestamp}.xlsx`;

    // Return the file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting departments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export departments',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
