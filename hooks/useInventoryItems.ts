import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export interface InventoryItem {
  _id: string;
  itemCode: string;
  name: string;
  description?: string;
  category: {
    id?: string;
    name: string;
  };
  unit: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  avgCostPerUnit: number;
  totalValue: number;
  storageLocation?: string;
  shelfLife?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemFilters {
  search?: string;
  category?: string;
  status?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateInventoryItemData {
  itemCode: string;
  name: string;
  description?: string;
  category: string; // category name
  unit: string;
  currentStock: number;
  reorderLevel: number;
  reorderQuantity?: number;
  avgCostPerUnit: number;
  storageLocation?: string;
  shelfLife?: number;
}

export interface UpdateInventoryItemData extends Partial<CreateInventoryItemData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
}

/**
 * Hook to fetch inventory items list with filters
 */
export function useInventoryItems(filters?: InventoryItemFilters) {
  return useQuery({
    queryKey: ['inventory-items', filters],
    queryFn: () => api.getInventoryItems(filters),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to fetch a single inventory item by ID
 */
export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => api.getInventoryItem(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new inventory item
 */
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryItemData) => api.createInventoryItem(data),
    onSuccess: () => {
      toast.success('Inventory item created successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create inventory item';
      toast.error(message);
    },
  });
}

/**
 * Hook to update an existing inventory item
 */
export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryItemData }) =>
      api.updateInventoryItem(id, data),
    onSuccess: (response, variables) => {
      toast.success('Inventory item updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update inventory item';
      toast.error(message);
    },
  });
}

/**
 * Hook to delete an inventory item (soft delete)
 */
export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteInventoryItem(id),
    onSuccess: () => {
      toast.success('Inventory item deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete inventory item';
      toast.error(message);
    },
  });
}

/**
 * Hook to get inventory statistics
 */
export function useInventoryStats() {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const [allItems, lowStockItems] = await Promise.all([
        api.getInventoryItems({}),
        api.getInventoryItems({ lowStock: true }),
      ]);

      const items = allItems.data || [];
      const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);

      return {
        total: allItems.meta?.pagination?.total || 0,
        lowStock: lowStockItems.meta?.pagination?.total || 0,
        totalValue: totalValue,
      };
    },
    staleTime: 60000, // 1 minute
  });
}
