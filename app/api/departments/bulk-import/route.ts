import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import connectDB from '@/lib/db/mongoose';
import Department from '@/lib/db/models/Department';

interface ImportRow {
  'Department Code (*)': string;
  'Department Name (*)': string;
  'Description': string;
  'Location': string;
  'Cost Center': string;
  'Status': string;
}

interface ValidationError {
  row: number;
  code: string;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
  successfulDepartments: any[];
}

/**
 * @route POST /api/departments/bulk-import
 * @desc Bulk import departments from Excel file
 * @access Private (ADMIN, SUPER_ADMIN, HR_ADMIN)
 */
export async function POST(req: NextRequest) {
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

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Excel file is empty' } },
        { status: 400 }
      );
    }

    // Validation and preparation
    const errors: ValidationError[] = [];
    const departmentsToCreate: any[] = [];
    const existingCodes = new Set(
      (await Department.find({}).select('code').lean()).map((d: any) => d.code.toUpperCase())
    );
    const existingNames = new Set(
      (await Department.find({}).select('name').lean()).map((d: any) => d.name.toLowerCase())
    );

    const validStatuses = ['ACTIVE', 'INACTIVE'];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row (accounting for header)
      const code = row['Department Code (*)']?.toString().trim().toUpperCase();
      const name = row['Department Name (*)']?.toString().trim();
      const description = row['Description']?.toString().trim();
      const location = row['Location']?.toString().trim();
      const costCenter = row['Cost Center']?.toString().trim();
      const status = row['Status']?.toString().trim().toUpperCase() || 'ACTIVE';

      // Validate required fields
      if (!code) {
        errors.push({ row: rowNumber, code: '-', field: 'Department Code', message: 'Department Code is required' });
        return;
      }

      if (!name) {
        errors.push({ row: rowNumber, code, field: 'Department Name', message: 'Department Name is required' });
        return;
      }

      // Check if code already exists
      if (existingCodes.has(code)) {
        errors.push({ row: rowNumber, code, field: 'Department Code', message: 'Department Code already exists' });
        return;
      }

      // Check if name already exists
      if (existingNames.has(name.toLowerCase())) {
        errors.push({ row: rowNumber, code, field: 'Department Name', message: 'Department Name already exists' });
        return;
      }

      // Validate status
      if (!validStatuses.includes(status)) {
        errors.push({
          row: rowNumber,
          code,
          field: 'Status',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      // Prepare department object
      departmentsToCreate.push({
        code,
        name,
        description: description || undefined,
        location: location || undefined,
        costCenter: costCenter || undefined,
        status,
        createdBy: user.id,
        updatedBy: user.id,
      });

      // Mark as processed (prevent duplicates in same file)
      existingCodes.add(code);
      existingNames.add(name.toLowerCase());
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      const result: ImportResult = {
        success: false,
        totalRows: data.length,
        successCount: 0,
        failureCount: errors.length,
        errors,
        successfulDepartments: [],
      };

      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Found ${errors.length} validation error(s)`,
        },
        data: result,
      }, { status: 400 });
    }

    // Bulk insert departments
    const createdDepartments = await Department.insertMany(departmentsToCreate);

    const result: ImportResult = {
      success: true,
      totalRows: data.length,
      successCount: createdDepartments.length,
      failureCount: 0,
      errors: [],
      successfulDepartments: createdDepartments.map((dept: any) => ({
        code: dept.code,
        name: dept.name,
        _id: dept._id,
      })),
    };

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdDepartments.length} department(s)`,
      data: result,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error during bulk import:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import departments',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
