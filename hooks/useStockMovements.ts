import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface StockMovement {
  _id: string;
  item: {
    id: string;
    itemCode: string;
    name: string;
  };
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  unit: string;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: 'PURCHASE_ORDER' | 'CONSUMPTION' | 'MANUAL' | 'TRANSFER' | 'RETURN' | 'RECONCILIATION';
  referenceId?: string;
  referenceNumber?: string;
  costPerUnit?: number;
  totalCost?: number;
  stockBefore: number;
  stockAfter: number;
  reason?: string;
  notes?: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
    approvedAt: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementFilters {
  itemId?: string;
  movementType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateStockMovementData {
  itemId: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: 'PURCHASE_ORDER' | 'CONSUMPTION' | 'MANUAL' | 'TRANSFER' | 'RETURN' | 'RECONCILIATION';
  referenceNumber?: string;
  costPerUnit?: number;
  reason?: string;
  notes?: string;
  transactionDate?: string;
}

export interface UpdateStockMovementData {
  // Fields that can be updated for PENDING movements
  itemId?: string;
  movementType?: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity?: number;
  fromLocation?: string;
  toLocation?: string;
  referenceType?: 'PURCHASE_ORDER' | 'CONSUMPTION' | 'MANUAL' | 'TRANSFER' | 'RETURN' | 'RECONCILIATION';
  referenceNumber?: string;
  costPerUnit?: number;
  reason?: string;
  transactionDate?: string;
  // Fields that can be updated for any movement
  notes?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  approve?: boolean;
}

/**
 * Hook to fetch stock movements list with filters
 */
export function useStockMovements(filters?: StockMovementFilters) {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => api.getStockMovements(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single stock movement by ID
 */
export function useStockMovement(id: string | null) {
  return useQuery({
    queryKey: ['stock-movement', id],
    queryFn: () => api.getStockMovement(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new stock movement
 */
export function useCreateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStockMovementData) => api.createStockMovement(data),
    onSuccess: () => {
      toast.success('Stock movement recorded successfully!');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to record stock movement';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing stock movement
 */
export function useUpdateStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStockMovementData }) =>
      api.updateStockMovement(id, data),
    onSuccess: (response, variables) => {
      toast.success('Stock movement updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['stock-movement', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update stock movement';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete a stock movement
 */
export function useDeleteStockMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteStockMovement(id),
    onSuccess: () => {
      toast.success('Stock movement deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movement-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete stock movement';
      toast.error(message);
    },
  });
}

/**
 * Hook to get stock movement statistics
 */
export function useStockMovementStats(filters?: StockMovementFilters) {
  return useQuery({
    queryKey: ['stock-movement-stats', filters],
    queryFn: async () => {
      const [allMovements, inMovements, outMovements] = await Promise.all([
        api.getStockMovements(filters),
        api.getStockMovements({ ...filters, movementType: 'IN' }),
        api.getStockMovements({ ...filters, movementType: 'OUT' }),
      ]);

      return {
        total: allMovements.meta?.pagination?.total || 0,
        in: inMovements.meta?.pagination?.total || 0,
        out: outMovements.meta?.pagination?.total || 0,
      };
    },
    staleTime: 5000, // 5 seconds - short stale time ensures stats update quickly after mutations
  });
}
