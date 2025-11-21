import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import connectDB from '@/lib/db/mongoose';
import Employee from '@/lib/db/models/Employee';
import Department from '@/lib/db/models/Department';
import Shift from '@/lib/db/models/Shift';

interface ImportRow {
  'Employee ID (*)': string;
  'Name (*)': string;
  'Email': string;
  'Phone': string;
  'Department Code (*)': string;
  'Shift Code (*)': string;
  'Employment Type (*)': string;
  'Designation': string;
  'Joining Date (*) (YYYY-MM-DD)': string;
  'Status': string;
  'HRMS System Type (*)': string;
  'HRMS External ID (*)': string;
}

interface ValidationError {
  row: number;
  employeeId: string;
  field: string;
  message: string;
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ValidationError[];
  successfulEmployees: any[];
}

/**
 * @route POST /api/employees/bulk-import
 * @desc Bulk import employees from Excel file
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

    // Fetch all departments and shifts for validation
    const [departments, shifts] = await Promise.all([
      Department.find({ isDeleted: false }).lean(),
      Shift.find({ isDeleted: false }).lean(),
    ]);

    // Create maps for quick lookup
    const departmentMap = new Map(departments.map((dept: any) => [dept.code, dept]));
    const shiftMap = new Map(shifts.map((shift: any) => [shift.code, shift]));

    // Validation and preparation
    const errors: ValidationError[] = [];
    const employeesToCreate: any[] = [];
    const existingEmployeeIds = new Set(
      (await Employee.find({ isDeleted: false }).select('employeeId').lean()).map((e: any) => e.employeeId)
    );

    const validEmploymentTypes = ['PERMANENT', 'CONTRACT', 'TEMPORARY', 'VENDOR'];
    const validStatuses = ['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED'];
    const validHrmsTypes = ['PERMANENT_HRMS', 'VENDOR_HRMS'];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row (accounting for header)
      const employeeId = row['Employee ID (*)']?.toString().trim().toUpperCase();
      const name = row['Name (*)']?.toString().trim();
      const email = row['Email']?.toString().trim();
      const phone = row['Phone']?.toString().trim();
      const departmentCode = row['Department Code (*)']?.toString().trim().toUpperCase();
      const shiftCode = row['Shift Code (*)']?.toString().trim().toUpperCase();
      const employmentType = row['Employment Type (*)']?.toString().trim().toUpperCase();
      const designation = row['Designation']?.toString().trim();
      const joiningDate = row['Joining Date (*) (YYYY-MM-DD)']?.toString().trim();
      const status = row['Status']?.toString().trim().toUpperCase() || 'ACTIVE';
      const hrmsSystemType = row['HRMS System Type (*)']?.toString().trim().toUpperCase();
      const hrmsExternalId = row['HRMS External ID (*)']?.toString().trim();

      // Validate required fields
      if (!employeeId) {
        errors.push({ row: rowNumber, employeeId: '-', field: 'Employee ID', message: 'Employee ID is required' });
        return;
      }

      if (!name) {
        errors.push({ row: rowNumber, employeeId, field: 'Name', message: 'Name is required' });
        return;
      }

      if (!departmentCode) {
        errors.push({ row: rowNumber, employeeId, field: 'Department Code', message: 'Department Code is required' });
        return;
      }

      if (!shiftCode) {
        errors.push({ row: rowNumber, employeeId, field: 'Shift Code', message: 'Shift Code is required' });
        return;
      }

      if (!employmentType) {
        errors.push({ row: rowNumber, employeeId, field: 'Employment Type', message: 'Employment Type is required' });
        return;
      }

      if (!joiningDate) {
        errors.push({ row: rowNumber, employeeId, field: 'Joining Date', message: 'Joining Date is required' });
        return;
      }

      if (!hrmsSystemType) {
        errors.push({ row: rowNumber, employeeId, field: 'HRMS System Type', message: 'HRMS System Type is required' });
        return;
      }

      if (!hrmsExternalId) {
        errors.push({ row: rowNumber, employeeId, field: 'HRMS External ID', message: 'HRMS External ID is required' });
        return;
      }

      // Check if employee ID already exists
      if (existingEmployeeIds.has(employeeId)) {
        errors.push({ row: rowNumber, employeeId, field: 'Employee ID', message: 'Employee ID already exists' });
        return;
      }

      // Check if department exists
      const department = departmentMap.get(departmentCode);
      if (!department) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'Department Code',
          message: `Department with code "${departmentCode}" not found`,
        });
        return;
      }

      // Check if shift exists
      const shift = shiftMap.get(shiftCode);
      if (!shift) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'Shift Code',
          message: `Shift with code "${shiftCode}" not found`,
        });
        return;
      }

      // Validate employment type
      if (!validEmploymentTypes.includes(employmentType)) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'Employment Type',
          message: `Invalid employment type. Must be one of: ${validEmploymentTypes.join(', ')}`,
        });
        return;
      }

      // Validate status
      if (!validStatuses.includes(status)) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'Status',
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      // Validate HRMS system type
      if (!validHrmsTypes.includes(hrmsSystemType)) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'HRMS System Type',
          message: `Invalid HRMS system type. Must be one of: ${validHrmsTypes.join(', ')}`,
        });
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(joiningDate)) {
        errors.push({
          row: rowNumber,
          employeeId,
          field: 'Joining Date',
          message: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }

      // Prepare employee object
      employeesToCreate.push({
        employeeId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        department: {
          id: department._id,
          name: department.name,
        },
        shift: {
          id: shift._id,
          name: shift.name,
        },
        employmentType,
        designation: designation || undefined,
        joiningDate: new Date(joiningDate),
        status,
        mealEligibility: {
          enabled: true,
        },
        biometricData: {
          faceDataSynced: false,
        },
        hrmsData: {
          systemType: hrmsSystemType,
          externalId: hrmsExternalId,
        },
        createdBy: user.id,
        updatedBy: user.id,
      });

      // Mark as processed (prevent duplicates in same file)
      existingEmployeeIds.add(employeeId);
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      const result: ImportResult = {
        success: false,
        totalRows: data.length,
        successCount: 0,
        failureCount: errors.length,
        errors,
        successfulEmployees: [],
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

    // Bulk insert employees
    const createdEmployees = await Employee.insertMany(employeesToCreate);

    const result: ImportResult = {
      success: true,
      totalRows: data.length,
      successCount: createdEmployees.length,
      failureCount: 0,
      errors: [],
      successfulEmployees: createdEmployees.map((emp: any) => ({
        employeeId: emp.employeeId,
        name: emp.name,
        _id: emp._id,
      })),
    };

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdEmployees.length} employee(s)`,
      data: result,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error during bulk import:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import employees',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
