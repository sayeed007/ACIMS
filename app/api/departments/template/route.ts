import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

/**
 * @route GET /api/departments/template
 * @desc Download Excel template for bulk department import
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

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Sample data with instructions
    const sampleData = [
      {
        'Department Code (*)': 'HR',
        'Department Name (*)': 'Human Resources',
        'Description': 'Manages employee relations and recruitment',
        'Location': 'Building A, Floor 2',
        'Cost Center': 'CC-HR-001',
        'Status': 'ACTIVE',
      },
      {
        'Department Code (*)': 'IT',
        'Department Name (*)': 'Information Technology',
        'Description': 'Manages IT infrastructure and support',
        'Location': 'Building B, Floor 1',
        'Cost Center': 'CC-IT-001',
        'Status': 'ACTIVE',
      },
      {
        'Department Code (*)': 'FIN',
        'Department Name (*)': 'Finance',
        'Description': 'Handles financial operations and accounting',
        'Location': 'Building A, Floor 3',
        'Cost Center': 'CC-FIN-001',
        'Status': 'ACTIVE',
      },
    ];

    // Create main sheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 }, // Department Code
      { wch: 30 }, // Department Name
      { wch: 45 }, // Description
      { wch: 25 }, // Location
      { wch: 18 }, // Cost Center
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');

    // Create instructions sheet
    const instructions = [
      ['DEPARTMENT BULK IMPORT TEMPLATE - INSTRUCTIONS'],
      [''],
      ['IMPORTANT: Fields marked with (*) are required'],
      [''],
      ['Field Descriptions:'],
      ['Department Code (*)', 'Unique identifier for the department (e.g., HR, IT, FIN). Must be uppercase.'],
      ['Department Name (*)', 'Full name of the department (e.g., Human Resources)'],
      ['Description', 'Brief description of the department and its role (optional)'],
      ['Location', 'Physical location or building information (optional)'],
      ['Cost Center', 'Cost center code for accounting purposes (optional)'],
      ['Status', 'One of: ACTIVE, INACTIVE (default: ACTIVE)'],
      [''],
      ['Valid Status Values:', 'ACTIVE, INACTIVE'],
      [''],
      ['TIPS:'],
      ['1. Do not modify the header row'],
      ['2. Remove sample data before adding your departments'],
      ['3. Department Code must be unique and uppercase'],
      ['4. Department Name must be unique'],
      ['5. Status defaults to ACTIVE if not provided'],
      ['6. All text values are case-sensitive except Department Code (auto-uppercased)'],
      [''],
      ['EXAMPLE:'],
      ['Department Code (*)', 'Department Name (*)', 'Description', 'Location', 'Cost Center', 'Status'],
      ['SALES', 'Sales Department', 'Manages sales operations', 'Building C', 'CC-SALES-001', 'ACTIVE'],
      ['MKT', 'Marketing', 'Brand and marketing', 'Building C', 'CC-MKT-001', 'ACTIVE'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return the file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="department_import_template_${new Date().toISOString().split('T')[0]}.xlsx"`,
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
