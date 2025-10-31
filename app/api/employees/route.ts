import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Employee } from '@/lib/db/models';
import {
  successResponse,
  createdResponse,
  validationError,
  conflictError,
  unauthorizedError,
  internalServerError,
  getPaginationParams,
  getPaginationMeta,
} from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/employees
 * Get list of employees with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Build query filters
    const query: any = {};

    // Filter by department
    const departmentId = searchParams.get('departmentId');
    if (departmentId) {
      query['department.id'] = departmentId;
    }

    // Filter by shift
    const shiftId = searchParams.get('shiftId');
    if (shiftId) {
      query['shift.id'] = shiftId;
    }

    // Filter by employment type
    const employmentType = searchParams.get('employmentType');
    if (employmentType) {
      query.employmentType = employmentType;
    }

    // Filter by status
    const status = searchParams.get('status');
    // Only apply status filter if explicitly provided and not empty
    // Pass 'all' or empty string to get all statuses
    if (status && status !== 'all' && status !== '') {
      query.status = status;
    } else if (!searchParams.has('status')) {
      // Default: only show active employees when status param is not provided at all
      query.status = 'ACTIVE';
    }
    // If status is explicitly 'all' or '', don't filter by status

    // Search by name or employee ID
    const search = searchParams.get('search');
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    // Execute query with pagination
    const [employees, total] = await Promise.all([
      Employee.find(query)
        .populate('department.id', 'name code')
        .populate('shift.id', 'name code')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Employee.countDocuments(query),
    ]);

    return successResponse(employees, getPaginationMeta({ page, limit, total }));
  } catch (error: any) {
    console.error('Get employees error:', error);
    return internalServerError('Failed to fetch employees', error.message);
  }
}

/**
 * POST /api/employees
 * Create a new employee
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Only HR_ADMIN and ADMIN can create employees
    if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return unauthorizedError('Insufficient permissions');
    }

    const body = await request.json();
    const {
      employeeId,
      name,
      email,
      phone,
      departmentId,
      departmentName,
      shiftId,
      shiftName,
      employmentType,
      designation,
      joiningDate,
      hrmsSystemType,
      hrmsExternalId,
    } = body;

    // Validation
    if (!employeeId || !name || !departmentId || !shiftId || !employmentType || !joiningDate) {
      return validationError(
        'Employee ID, name, department, shift, employment type, and joining date are required'
      );
    }

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return conflictError('Employee with this ID already exists');
    }

    // Create employee
    const employee = new Employee({
      employeeId,
      name,
      email,
      phone,
      department: {
        id: departmentId,
        name: departmentName,
      },
      shift: {
        id: shiftId,
        name: shiftName,
      },
      employmentType,
      designation,
      joiningDate: new Date(joiningDate),
      status: 'ACTIVE',
      mealEligibility: {
        enabled: true,
      },
      biometricData: {
        faceDataSynced: false,
      },
      hrmsData: {
        systemType: hrmsSystemType || 'PERMANENT_HRMS',
        externalId: hrmsExternalId || employeeId,
      },
      createdBy: user._id,
      updatedBy: user._id,
    });

    await employee.save();

    return createdResponse(employee);
  } catch (error: any) {
    console.error('Create employee error:', error);
    return internalServerError('Failed to create employee', error.message);
  }
}
