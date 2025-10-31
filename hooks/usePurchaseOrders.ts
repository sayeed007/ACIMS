import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface PurchaseOrder {
  _id: string
  poNumber: string
  poDate: string
  vendor: {
    id: string
    vendorCode: string
    name: string
    contact: string
  }
  deliveryDate: string
  status: 'DRAFT' | 'APPROVED' | 'SENT_TO_VENDOR' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED'
  totalAmount: number
  items: any[]
  createdAt: string
  updatedAt: string
}

export function usePurchaseOrders(filters?: any) {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => api.getPurchaseOrders(filters),
    staleTime: 30000,
  })
}

export function usePurchaseOrder(id: string | null) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => api.getPurchaseOrder(id!),
    enabled: !!id,
  })
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.createPurchaseOrder(data),
    onSuccess: () => {
      toast.success('Purchase order created successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['po-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create PO')
    },
  })
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updatePurchaseOrder(id, data),
    onSuccess: (response, variables) => {
      toast.success('Purchase order updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update PO')
    },
  })
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deletePurchaseOrder(id),
    onSuccess: () => {
      toast.success('Purchase order deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['po-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete PO')
    },
  })
}

export function usePurchaseOrderStats() {
  return useQuery({
    queryKey: ['po-stats'],
    queryFn: () => api.getPurchaseOrderStats(),
    staleTime: 60000,
  })
}
