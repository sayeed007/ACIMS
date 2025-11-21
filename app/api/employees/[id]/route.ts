import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import { Employee } from '@/lib/db/models';
import {
  successResponse,
  validationError,
  notFoundError,
  unauthorizedError,
  internalServerError,
} from '@/lib/utils/api-response';
import { getCurrentUser } from '@/lib/utils/auth-helpers';

// export const dynamic = 'force-dynamic';

/**
 * GET /api/employees/[id]
 * Get single employee by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    const { id } = await params;
    const employee = await Employee.findById(id)
      .populate('department.id', 'name code')
      .populate('shift.id', 'name code')
      .lean();

    if (!employee) {
      return notFoundError('Employee not found');
    }

    return successResponse(employee);
  } catch (error: any) {
    console.error('Get employee error:', error);
    return internalServerError('Failed to fetch employee', error.message);
  }
}

/**
 * PUT /api/employees/[id]
 * Update employee
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Only HR_ADMIN and ADMIN can update employees
    if (!['HR_ADMIN', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return unauthorizedError('Insufficient permissions');
    }

    const { id } = await params;
    const body = await request.json();

    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundError('Employee not found');
    }

    // Update basic fields
    if (body.name) employee.name = body.name;
    if (body.email) employee.email = body.email;
    if (body.phone) employee.phone = body.phone;
    if (body.designation) employee.designation = body.designation;
    if (body.status) employee.status = body.status;
    if (body.employmentType) employee.employmentType = body.employmentType;
    if (body.dateOfJoining) employee.joiningDate = new Date(body.dateOfJoining);

    // Handle department update
    if (body.departmentId) {
      if (body.departmentName) {
        employee.department = {
          id: body.departmentId,
          name: body.departmentName,
        };
      } else {
        // Fetch department name from database
        const Department = (await import('@/lib/db/models')).Department;
        const dept = await Department.findById(body.departmentId);
        if (dept) {
          employee.department = {
            id: body.departmentId,
            name: dept.name,
          };
        }
      }
    }

    // Handle shift update
    if (body.shiftId) {
      if (body.shiftName) {
        employee.shift = {
          id: body.shiftId,
          name: body.shiftName,
        };
      } else {
        // Fetch shift name from database
        const Shift = (await import('@/lib/db/models')).Shift;
        const shift = await Shift.findById(body.shiftId);
        if (shift) {
          employee.shift = {
            id: body.shiftId,
            name: shift.name,
          };
        }
      }
    }

    if (body.mealEligibility) {
      employee.mealEligibility = {
        ...employee.mealEligibility,
        ...body.mealEligibility,
      };
    }

    employee.updatedBy = user._id;
    await employee.save();

    return successResponse(employee);
  } catch (error: any) {
    console.error('Update employee error:', error);
    return internalServerError('Failed to update employee', error.message);
  }
}

/**
 * DELETE /api/employees/[id]
 * Soft delete employee
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedError('Authentication required');
    }

    // Only ADMIN can delete employees
    if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return unauthorizedError('Insufficient permissions');
    }

    const { id } = await params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return notFoundError('Employee not found');
    }

    // Soft delete
    employee.isDeleted = true;
    employee.status = 'INACTIVE';
    employee.updatedBy = user._id;
    await employee.save();

    return successResponse({ message: 'Employee deleted successfully' });
  } catch (error: any) {
    console.error('Delete employee error:', error);
    return internalServerError('Failed to delete employee', error.message);
  }
}
