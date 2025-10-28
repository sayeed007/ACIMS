import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  shift: {
    _id: string;
    name: string;
    code: string;
  };
  biometric?: {
    isActive: boolean;
    deviceId?: string;
    enrollmentId?: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  employeeType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'VENDOR_STAFF';
  dateOfJoining: string;
  dateOfLeaving?: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  shiftId?: string;
  status?: string;
  employeeType?: string;
  page?: number;
  limit?: number;
}

export interface CreateEmployeeData {
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  departmentId: string;
  shiftId: string;
  employeeType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'VENDOR_STAFF';
  dateOfJoining: string;
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  dateOfLeaving?: string;
}

/**
 * Hook to fetch employees list with filters
 */
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => api.getEmployees(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single employee by ID
 */
export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.getEmployee(id!),
    enabled: !!id, // Only run if ID is provided
  });
}

/**
 * Hook to create a new employee
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeData) => api.createEmployee(data),
    onSuccess: (response) => {
      toast.success('Employee created successfully!');
      // Invalidate and refetch employees list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create employee';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing employee
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeData }) =>
      api.updateEmployee(id, data),
    onSuccess: (response, variables) => {
      toast.success('Employee updated successfully!');
      // Invalidate specific employee and list
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update employee';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an employee (soft delete)
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      toast.success('Employee deleted successfully!');
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete employee';
      toast.error(message);
    },
  });
}

/**
 * Hook to get employee statistics
 */
export function useEmployeeStats() {
  return useQuery({
    queryKey: ['employee-stats'],
    queryFn: async () => {
      // Fetch different employee counts in parallel
      const [activeEmployees, contractEmployees, allEmployees] = await Promise.all([
        api.getEmployees({ status: 'ACTIVE' }),
        api.getEmployees({ employeeType: 'VENDOR_STAFF' }),
        api.getEmployees({}),
      ]);

      return {
        total: allEmployees.meta?.pagination?.total || 0,
        active: activeEmployees.meta?.pagination?.total || 0,
        contract: contractEmployees.meta?.pagination?.total || 0,
      };
    },
    staleTime: 60000, // 1 minute
  });
}
