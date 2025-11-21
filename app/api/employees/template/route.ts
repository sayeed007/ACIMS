import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import connectDB from '@/lib/db/mongoose';
import Department from '@/lib/db/models/Department';
import Shift from '@/lib/db/models/Shift';

/**
 * @route GET /api/employees/template
 * @desc Download Excel template for bulk employee import
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
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'HR_ADMIN'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    await connectDB();

    // Fetch departments and shifts for reference
    const [departments, shifts] = await Promise.all([
      Department.find({ isDeleted: false }).select('name code').lean(),
      Shift.find({ isDeleted: false }).select('name code').lean(),
    ]);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sample data with instructions
    const sampleData = [
      {
        'Employee ID (*)': 'EMP001',
        'Name (*)': 'John Doe',
        'Email': 'john.doe@company.com',
        'Phone': '+1234567890',
        'Department Code (*)': departments[0]?.code || 'DEPT001',
        'Shift Code (*)': shifts[0]?.code || 'DAY',
        'Employment Type (*)': 'PERMANENT',
        'Designation': 'Software Engineer',
        'Joining Date (*) (YYYY-MM-DD)': '2024-01-15',
        'Status': 'ACTIVE',
        'HRMS System Type (*)': 'PERMANENT_HRMS',
        'HRMS External ID (*)': 'EMP001',
      },
      {
        'Employee ID (*)': 'EMP002',
        'Name (*)': 'Jane Smith',
        'Email': 'jane.smith@company.com',
        'Phone': '+1234567891',
        'Department Code (*)': departments[0]?.code || 'DEPT001',
        'Shift Code (*)': shifts[0]?.code || 'DAY',
        'Employment Type (*)': 'CONTRACT',
        'Designation': 'Project Manager',
        'Joining Date (*) (YYYY-MM-DD)': '2024-02-01',
        'Status': 'ACTIVE',
        'HRMS System Type (*)': 'PERMANENT_HRMS',
        'HRMS External ID (*)': 'EMP002',
      },
    ];

    // Create main sheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Employee ID
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 18 }, // Department Code
      { wch: 15 }, // Shift Code
      { wch: 18 }, // Employment Type
      { wch: 20 }, // Designation
      { wch: 22 }, // Joining Date
      { wch: 12 }, // Status
      { wch: 20 }, // HRMS System Type
      { wch: 20 }, // HRMS External ID
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    // Create instructions sheet
    const instructions = [
      ['EMPLOYEE BULK IMPORT TEMPLATE - INSTRUCTIONS'],
      [''],
      ['IMPORTANT: Fields marked with (*) are required'],
      [''],
      ['Field Descriptions:'],
      ['Employee ID (*)', 'Unique identifier for the employee (e.g., EMP001, EMP002)'],
      ['Name (*)', 'Full name of the employee'],
      ['Email', 'Employee email address (optional)'],
      ['Phone', 'Phone number with country code (optional)'],
      ['Department Code (*)', 'Department code - must match existing department'],
      ['Shift Code (*)', 'Shift code - must match existing shift'],
      ['Employment Type (*)', 'One of: PERMANENT, CONTRACT, TEMPORARY, VENDOR'],
      ['Designation', 'Job title or designation (optional)'],
      ['Joining Date (*)', 'Date in YYYY-MM-DD format (e.g., 2024-01-15)'],
      ['Status', 'One of: ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED (default: ACTIVE)'],
      ['HRMS System Type (*)', 'One of: PERMANENT_HRMS, VENDOR_HRMS'],
      ['HRMS External ID (*)', 'Employee ID in the HRMS system'],
      [''],
      ['Valid Employment Types:', 'PERMANENT, CONTRACT, TEMPORARY, VENDOR'],
      ['Valid Status Values:', 'ACTIVE, INACTIVE, ON_LEAVE, SUSPENDED'],
      ['Valid HRMS System Types:', 'PERMANENT_HRMS, VENDOR_HRMS'],
      [''],
      ['TIPS:'],
      ['1. Do not modify the header row'],
      ['2. Remove sample data before adding your employees'],
      ['3. Date must be in YYYY-MM-DD format'],
      ['4. Employee ID must be unique'],
      ['5. Department and Shift codes must exist in the system'],
      ['6. All text values are case-sensitive'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Create reference sheets for departments and shifts
    const departmentData = departments.map((dept: any) => ({
      Code: dept.code,
      Name: dept.name,
    }));

    const shiftData = shifts.map((shift: any) => ({
      Code: shift.code,
      Name: shift.name,
    }));

    if (departmentData.length > 0) {
      const deptSheet = XLSX.utils.json_to_sheet(departmentData);
      deptSheet['!cols'] = [{ wch: 15 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, deptSheet, 'Departments');
    }

    if (shiftData.length > 0) {
      const shiftSheet = XLSX.utils.json_to_sheet(shiftData);
      shiftSheet['!cols'] = [{ wch: 15 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, shiftSheet, 'Shifts');
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="employee_import_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEMPLATE_GENERATION_ERROR',
          message: 'Failed to generate template',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
