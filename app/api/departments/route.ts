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
  getPaginationParams,
  getPaginationMeta,
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
    const search = searchParams.get('search');

    // Get pagination params
    const { page, limit, skip } = getPaginationParams(searchParams);

    // Build query
    const query: any = { isDeleted: false }; // Exclude soft-deleted departments by default

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

    // Get total count for pagination
    const total = await Department.countDocuments(query);

    // Fetch departments with pagination
    const departments = await Department.find(query)
      .populate('headOfDepartment', 'name email')
      .populate('parentDepartment', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Return with pagination metadata
    return successResponse(departments, getPaginationMeta({ page, limit, total }));
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
    const { name, code, description, location, costCenter, headOfDepartment, parentDepartment } = body;

    // Validation
    if (!name || !code) {
      return validationError('Name and code are required');
    }

    // Check if code already exists (excluding soft-deleted departments)
    const existingDept = await Department.findOne({
      code: code.toUpperCase(),
      isDeleted: false
    });
    if (existingDept) {
      return conflictError('Department with this code already exists');
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      location,
      costCenter,
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
