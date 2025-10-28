import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Department } from '@/lib/db/models';
import {
  successResponse,
  createdResponse,
  validationError,
  conflictError,
  unauthorizedError,
  internalServerError,
} from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/departments
 * Get all departments
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const departments = await Department.find(query)
      .populate('headOfDepartment', 'name email')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 })
      .lean();

    return successResponse(departments);
  } catch (error: any) {
    console.error('Get departments error:', error);
    return internalServerError('Failed to fetch departments', error.message);
  }
}

/**
 * POST /api/departments
 * Create new department
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Only ADMIN can create departments
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return unauthorizedError('Insufficient permissions');
    }

    const body = await request.json();
    const { name, code, description, headOfDepartment, parentDepartment } = body;

    // Validation
    if (!name || !code) {
      return validationError('Name and code are required');
    }

    // Check if code already exists
    const existingDept = await Department.findOne({ code: code.toUpperCase() });
    if (existingDept) {
      return conflictError('Department with this code already exists');
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      headOfDepartment,
      parentDepartment,
      status: 'ACTIVE',
      createdBy: user._id,
      updatedBy: user._id,
    });

    await department.save();

    return createdResponse(department);
  } catch (error: any) {
    console.error('Create department error:', error);
    return internalServerError('Failed to create department', error.message);
  }
}
