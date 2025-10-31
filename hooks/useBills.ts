import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface Bill {
  _id: string
  billNumber: string
  billDate: string
  dueDate: string
  vendor: {
    id: string
    vendorCode: string
    name: string
  }
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'FULLY_PAID'
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
  items: any[]
  createdAt: string
  updatedAt: string
}

export function useBills(filters?: any) {
  return useQuery({
    queryKey: ['bills', filters],
    queryFn: () => api.getBills(filters),
    staleTime: 30000,
  })
}

export function useBill(id: string | null) {
  return useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.getBill(id!),
    enabled: !!id,
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.createBill(data),
    onSuccess: () => {
      toast.success('Bill created successfully!')
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create bill')
    },
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateBill(id, data),
    onSuccess: (response, variables) => {
      toast.success('Bill updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['bill', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update bill')
    },
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteBill(id),
    onSuccess: () => {
      toast.success('Bill deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete bill')
    },
  })
}

export function useBillStats() {
  return useQuery({
    queryKey: ['bill-stats'],
    queryFn: () => api.getBillStats(),
    staleTime: 60000,
  })
}
