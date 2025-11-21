import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface Reconciliation {
  _id: string
  item: {
    id: string
    itemCode: string
    name: string
  }
  systemStock: number
  physicalStock: number
  discrepancy: number
  discrepancyPercentage: number
  unit: string
  reconciliationDate: string
  location?: string
  reason?: string
  notes?: string
  performedBy: {
    id: string
    name: string
    email: string
  }
  verifiedBy?: {
    id: string
    name: string
    email: string
    verifiedAt: string
  }
  approvedBy?: {
    id: string
    name: string
    email: string
    approvedAt: string
  }
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  adjustmentReference?: {
    movementId: string
    movementType: string
    adjustmentApplied: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface ReconciliationFilters {
  itemId?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface CreateReconciliationData {
  itemId: string
  physicalStock: number
  reconciliationDate?: string
  location?: string
  reason?: string
  notes?: string
  status?: 'DRAFT' | 'SUBMITTED'
  autoAdjust?: boolean
}

export interface UpdateReconciliationData {
  // Fields that can be updated for DRAFT reconciliations
  itemId?: string
  physicalStock?: number
  reconciliationDate?: string
  location?: string
  reason?: string
  notes?: string
  autoAdjust?: boolean
  // Fields that can be updated for any reconciliation
  status?: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  verify?: boolean
  approve?: boolean
  reject?: boolean
}

/**
 * Hook to fetch reconciliations list with filters
 */
export function useReconciliations(filters?: ReconciliationFilters) {
  return useQuery({
    queryKey: ['reconciliations', filters],
    queryFn: () => api.getReconciliations(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single reconciliation by ID
 */
export function useReconciliation(id: string | null) {
  return useQuery({
    queryKey: ['reconciliation', id],
    queryFn: () => api.getReconciliation(id!),
    enabled: !!id,
  })
}

/**
 * Hook to create a new reconciliation
 */
export function useCreateReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReconciliationData) => api.createReconciliation(data),
    onSuccess: () => {
      toast.success('Reconciliation created successfully!')
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create reconciliation'
      toast.error(message)
    },
  })
}

/**
 * Hook to update an existing reconciliation
 */
export function useUpdateReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReconciliationData }) =>
      api.updateReconciliation(id, data),
    onSuccess: (response, variables) => {
      toast.success('Reconciliation updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['reconciliation', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update reconciliation'
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a reconciliation
 */
export function useDeleteReconciliation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteReconciliation(id),
    onSuccess: () => {
      toast.success('Reconciliation deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['reconciliations'] })
      queryClient.invalidateQueries({ queryKey: ['reconciliation-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete reconciliation'
      toast.error(message)
    },
  })
}

/**
 * Hook to get reconciliation statistics
 */
export function useReconciliationStats(filters?: ReconciliationFilters) {
  return useQuery({
    queryKey: ['reconciliation-stats', filters],
    queryFn: async () => {
      const [allReconciliations, draftReconciliations, completedReconciliations] = await Promise.all([
        api.getReconciliations(filters),
        api.getReconciliations({ ...filters, status: 'DRAFT' }),
        api.getReconciliations({ ...filters, status: 'COMPLETED' }),
      ])

      return {
        total: allReconciliations.meta?.pagination?.total || 0,
        draft: draftReconciliations.meta?.pagination?.total || 0,
        completed: completedReconciliations.meta?.pagination?.total || 0,
      }
    },
    staleTime: 60000, // 1 minute
  })
}
