import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface PurchaseDemandItem {
  item: {
    id: string
    itemCode: string
    name: string
  }
  currentStock: number
  requiredQuantity: number
  demandedQuantity: number
  unit: string
  suggestedVendors?: string[]
  remarks?: string
}

export interface PurchaseDemand {
  _id: string
  demandNumber: string
  demandDate: string
  requiredByDate: string
  generationType: 'AUTO' | 'MANUAL'
  items: PurchaseDemandItem[]
  createdBy: {
    id: string
    name: string
    email: string
  }
  finalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PO_CREATED'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DemandFilters {
  status?: string
  generationType?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Hook to fetch demands list with filters
 */
export function usePurchaseDemands(filters?: DemandFilters) {
  return useQuery({
    queryKey: ['purchase-demands', filters],
    queryFn: () => api.getDemands(filters),
    staleTime: 30000,
  })
}

/**
 * Hook to fetch a single demand by ID
 */
export function usePurchaseDemand(id: string | null) {
  return useQuery({
    queryKey: ['purchase-demand', id],
    queryFn: () => api.getDemand(id!),
    enabled: !!id,
  })
}

/**
 * Hook to create a new demand
 */
export function useCreatePurchaseDemand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => api.createDemand(data),
    onSuccess: () => {
      toast.success('Purchase demand created successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-demands'] })
      queryClient.invalidateQueries({ queryKey: ['demand-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create demand'
      toast.error(message)
    },
  })
}

/**
 * Hook to update an existing demand
 */
export function useUpdatePurchaseDemand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateDemand(id, data),
    onSuccess: (response, variables) => {
      toast.success('Purchase demand updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-demand', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-demands'] })
      queryClient.invalidateQueries({ queryKey: ['demand-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update demand'
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a demand
 */
export function useDeletePurchaseDemand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteDemand(id),
    onSuccess: () => {
      toast.success('Purchase demand deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-demands'] })
      queryClient.invalidateQueries({ queryKey: ['demand-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete demand'
      toast.error(message)
    },
  })
}

/**
 * Hook to get demand statistics
 */
export function usePurchaseDemandStats() {
  return useQuery({
    queryKey: ['demand-stats'],
    queryFn: () => api.getDemandStats(),
    staleTime: 5000, // 5 seconds
  })
}
