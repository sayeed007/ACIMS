import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: {
    _id: string;
    name: string;
    employeeId: string;
  };
  costCenter?: string;
  location?: string;
  status: 'ACTIVE' | 'INACTIVE';
  employeeCount?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
  description?: string;
  headOfDepartmentId?: string;
  costCenter?: string;
  location?: string;
}

export interface UpdateDepartmentData extends Partial<CreateDepartmentData> {
  status?: 'ACTIVE' | 'INACTIVE';
}

/**
 * Hook to fetch departments list with filters
 */
export function useDepartments(filters?: DepartmentFilters) {
  return useQuery({
    queryKey: ['departments', filters],
    queryFn: () => api.getDepartments(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single department by ID
 */
export function useDepartment(id: string | null) {
  return useQuery({
    queryKey: ['department', id],
    queryFn: () => api.getDepartment(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new department
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentData) => api.createDepartment(data),
    onSuccess: () => {
      toast.success('Department created successfully!');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create department';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing department
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentData }) =>
      api.updateDepartment(id, data),
    onSuccess: (response, variables) => {
      toast.success('Department updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['department', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update department';
      toast.error(message);
    },
  });
}

/**
 * Hook to archive a department (soft delete)
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteDepartment(id),
    onSuccess: () => {
      toast.success('Department archived successfully!');
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['department-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to archive department';
      toast.error(message);
    },
  });
}

/**
 * Hook to get department statistics
 */
export function useDepartmentStats() {
  return useQuery({
    queryKey: ['department-stats'],
    queryFn: async () => {
      const [activeDepts, allDepts] = await Promise.all([
        api.getDepartments({ status: 'ACTIVE' }),
        api.getDepartments({}),
      ]);

      return {
        total: allDepts.meta?.pagination?.total || 0,
        active: activeDepts.meta?.pagination?.total || 0,
      };
    },
    staleTime: 5000, // 5 seconds - short stale time ensures stats update quickly after mutations
  });
}

/**
 * Hook to bulk import departments from Excel file
 */
export function useBulkImportDepartments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/departments/bulk-import', {
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
        toast.success(`Successfully imported ${successCount} department(s)!`);
        // Invalidate departments list to refresh data
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        queryClient.invalidateQueries({ queryKey: ['department-stats'] });
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to import departments';
      toast.error(message);
    },
  });
}
