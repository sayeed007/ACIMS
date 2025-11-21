import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface Shift {
  _id: string;
  name: string;
  code: string;
  description?: string;
  startTime: string;
  endTime: string;
  mealEligibility: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
  gracePeriod?: {
    entry: number;
    exit: number;
  };
  status: 'ACTIVE' | 'INACTIVE';
  employeeCount?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateShiftData {
  name: string;
  code: string;
  description?: string;
  startTime: string;
  endTime: string;
  mealEligibility: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  };
  gracePeriod?: {
    entry: number;
    exit: number;
  };
}

export interface UpdateShiftData extends Partial<CreateShiftData> {
  status?: 'ACTIVE' | 'INACTIVE';
}

/**
 * Hook to fetch shifts list with filters
 */
export function useShifts(filters?: ShiftFilters) {
  return useQuery({
    queryKey: ['shifts', filters],
    queryFn: () => api.getShifts(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single shift by ID
 */
export function useShift(id: string | null) {
  return useQuery({
    queryKey: ['shift', id],
    queryFn: () => api.getShift(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new shift
 */
export function useCreateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShiftData) => api.createShift(data),
    onSuccess: () => {
      toast.success('Shift created successfully!');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create shift';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing shift
 */
export function useUpdateShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShiftData }) =>
      api.updateShift(id, data),
    onSuccess: (response, variables) => {
      toast.success('Shift updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['shift', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update shift';
      toast.error(message);
    },
  });
}

/**
 * Hook to archive a shift (soft delete)
 */
export function useDeleteShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteShift(id),
    onSuccess: () => {
      toast.success('Shift archived successfully!');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to archive shift';
      toast.error(message);
    },
  });
}

/**
 * Hook to get shift statistics
 */
export function useShiftStats() {
  return useQuery({
    queryKey: ['shift-stats'],
    queryFn: async () => {
      const [activeShifts, allShifts] = await Promise.all([
        api.getShifts({ status: 'ACTIVE' }),
        api.getShifts({}),
      ]);

      return {
        total: allShifts.meta?.pagination?.total || 0,
        active: activeShifts.meta?.pagination?.total || 0,
      };
    },
    staleTime: 5000, // 5 seconds - short stale time ensures stats update quickly after mutations
  });
}
