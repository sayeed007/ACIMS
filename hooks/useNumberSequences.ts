import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface NumberSequence {
  _id: string
  entityType: 'BILL' | 'DEMAND' | 'PURCHASE_ORDER' | 'STOCK_MOVEMENT' | 'EMPLOYEE' | 'VENDOR'
  prefix: string
  length: number
  currentNumber: number
  format: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function useNumberSequences() {
  return useQuery({
    queryKey: ['number-sequences'],
    queryFn: () => api.getNumberSequences(),
  })
}

export function useInitializeSequences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.initializeNumberSequences(),
    onSuccess: () => {
      toast.success('Number sequences initialized successfully!')
      queryClient.invalidateQueries({ queryKey: ['number-sequences'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to initialize sequences')
    },
  })
}

export function useUpdateSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      entityType,
      data,
    }: {
      entityType: string
      data: { prefix?: string; length?: number; description?: string }
    }) => api.updateNumberSequence(entityType, data),
    onSuccess: () => {
      toast.success('Sequence updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['number-sequences'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update sequence')
    },
  })
}

export function useResetSequence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ entityType, resetTo }: { entityType: string; resetTo: number }) =>
      api.resetNumberSequence(entityType, { resetTo }),
    onSuccess: () => {
      toast.success('Sequence reset successfully!')
      queryClient.invalidateQueries({ queryKey: ['number-sequences'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to reset sequence')
    },
  })
}
