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
    id?: {
      _id: string;
      name: string;
      code?: string;
    };
    name: string;
  };
  shift: {
    id?: {
      _id: string;
      name: string;
      code?: string;
    };
    name: string;
  };
  biometric?: {
    isActive: boolean;
    deviceId?: string;
    enrollmentId?: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  employmentType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'VENDOR';
  designation?: string;
  joiningDate: string;
  exitDate?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  shiftId?: string;
  status?: string;
  employmentType?: string;
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
  employmentType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'VENDOR';
  dateOfJoining: string;
  designation?: string;
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
  exitDate?: string;
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
      // Invalidate and refetch employees list and stats
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update employee';
      toast.error(message);
    },
  });
}

/**
 * Hook to archive an employee (soft delete)
 */
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteEmployee(id),
    onSuccess: () => {
      toast.success('Employee archived successfully!');
      // Invalidate employees list and stats
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to archive employee';
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
      const [activeEmployees, vendorEmployees, allEmployees] = await Promise.all([
        api.getEmployees({ status: 'ACTIVE' }),
        api.getEmployees({ employmentType: 'VENDOR', status: 'all' }),
        api.getEmployees({ status: 'all' }), // Pass 'all' to get total count of all employees
      ]);

      return {
        total: allEmployees.meta?.pagination?.total || 0,
        active: activeEmployees.meta?.pagination?.total || 0,
        contract: vendorEmployees.meta?.pagination?.total || 0,
      };
    },
    staleTime: 5000, // 5 seconds - short stale time ensures stats update quickly after mutations
  });
}

/**
 * Hook to bulk import employees from Excel file
 */
export function useBulkImportEmployees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/employees/bulk-import', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw { response: { data } };
      }

      return data;
    },
    onSuccess: (response) => {
      const successCount = response.data?.successCount || 0;
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} employee(s)!`);
        // Invalidate employees list to refresh data
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        queryClient.invalidateQueries({ queryKey: ['employee-stats'] });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to import employees';
      toast.error(message);
    },
  });
}
