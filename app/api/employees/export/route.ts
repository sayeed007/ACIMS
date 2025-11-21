import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import connectDB from '@/lib/db/mongoose';
import Employee from '@/lib/db/models/Employee';

/**
 * @route GET /api/employees/export
 * @desc Export employees to Excel based on filters
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
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN', 'CANTEEN_MANAGER', 'STORE_KEEPER'];
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
    const departmentId = searchParams.get('departmentId');
    const shiftId = searchParams.get('shiftId');
    const employmentType = searchParams.get('employmentType');
    const status = searchParams.get('status');

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { employeeId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (departmentId) {
      query['department.id'] = departmentId;
    }

    if (shiftId) {
      query['shift.id'] = shiftId;
    }

    if (employmentType) {
      query.employmentType = employmentType;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Fetch employees
    const employees = await Employee.find(query)
      .sort({ createdAt: -1 })
      .limit(10000) // Safety limit
      .lean();

    if (employees.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_DATA', message: 'No employees found with the applied filters' },
        },
        { status: 404 }
      );
    }

    // Prepare data for Excel
    const exportData = employees.map((employee: any, index: number) => ({
      '#': index + 1,
      'Employee ID': employee.employeeId,
      'Name': employee.name,
      'Email': employee.email || '-',
      'Phone': employee.phone || '-',
      'Department': employee.department.name,
      'Shift': employee.shift.name,
      'Employment Type': employee.employmentType,
      'Designation': employee.designation || '-',
      'Joining Date': employee.joiningDate
        ? new Date(employee.joiningDate).toISOString().split('T')[0]
        : '-',
      'Status': employee.status,
      'Meal Eligibility': employee.mealEligibility?.enabled ? 'Yes' : 'No',
      'Biometric Synced': employee.biometricData?.faceDataSynced ? 'Yes' : 'No',
      'HRMS System': employee.hrmsData?.systemType || '-',
      'HRMS ID': employee.hrmsData?.externalId || '-',
      'Created At': new Date(employee.createdAt).toLocaleString('en-US'),
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 15 }, // Employee ID
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 20 }, // Department
      { wch: 15 }, // Shift
      { wch: 18 }, // Employment Type
      { wch: 20 }, // Designation
      { wch: 15 }, // Joining Date
      { wch: 12 }, // Status
      { wch: 18 }, // Meal Eligibility
      { wch: 18 }, // Biometric Synced
      { wch: 18 }, // HRMS System
      { wch: 15 }, // HRMS ID
      { wch: 20 }, // Created At
    ];

    // Style header row (make it bold)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } },
      };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Add summary sheet
    const summary = [
      ['Employee Export Summary'],
      [''],
      ['Export Date:', new Date().toLocaleString('en-US')],
      ['Exported By:', user.name || user.email],
      ['Total Employees:', employees.length],
      [''],
      ['Filters Applied:'],
      ['Search:', search || 'None'],
      ['Department:', departmentId ? employees[0]?.department?.name : 'All'],
      ['Shift:', shiftId ? employees[0]?.shift?.name : 'All'],
      ['Employment Type:', employmentType || 'All'],
      ['Status:', status || 'All'],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `employees_export_${timestamp}.xlsx`;

    // Return the file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting employees:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export employees',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
