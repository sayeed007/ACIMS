import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface MealSession {
  _id: string;
  name: string;
  code: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' | 'OVERTIME_MEAL';
  startTime: string;
  endTime: string;
  description?: string;
  isActive: boolean;
  allowedShifts?: string[];
  allowedDepartments?: string[];
  maxCapacity?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealSessionFilters {
  search?: string;
  mealType?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateMealSessionData {
  name: string;
  code: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACKS' | 'OVERTIME_MEAL';
  startTime: string;
  endTime: string;
  description?: string;
  allowedShifts?: string[];
  allowedDepartments?: string[];
  maxCapacity?: number;
}

export interface UpdateMealSessionData extends Partial<CreateMealSessionData> {
  isActive?: boolean;
}

/**
 * Hook to fetch meal sessions list with filters
 */
export function useMealSessions(filters?: MealSessionFilters) {
  return useQuery({
    queryKey: ['meal-sessions', filters],
    queryFn: () => api.getMealSessions(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single meal session by ID
 */
export function useMealSession(id: string | null) {
  return useQuery({
    queryKey: ['meal-session', id],
    queryFn: () => api.getMealSession(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new meal session
 */
export function useCreateMealSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMealSessionData) => api.createMealSession(data),
    onSuccess: () => {
      toast.success('Meal session created successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-sessions'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create meal session';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing meal session
 */
export function useUpdateMealSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMealSessionData }) =>
      api.updateMealSession(id, data),
    onSuccess: (response, variables) => {
      toast.success('Meal session updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-session', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['meal-sessions'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update meal session';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a meal session (soft delete)
 */
export function useDeleteMealSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteMealSession(id),
    onSuccess: () => {
      toast.success('Meal session deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['meal-sessions'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete meal session';
      toast.error(message);
    },
  });
}

/**
 * Hook to get meal session statistics
 */
export function useMealSessionStats() {
  return useQuery({
    queryKey: ['meal-session-stats'],
    queryFn: async () => {
      const [activeSessions, allSessions] = await Promise.all([
        api.getMealSessions({ isActive: true }),
        api.getMealSessions({}),
      ]);

      return {
        total: allSessions.meta?.pagination?.total || 0,
        active: activeSessions.meta?.pagination?.total || 0,
      };
    },
    staleTime: 60000, // 1 minute
  });
}
