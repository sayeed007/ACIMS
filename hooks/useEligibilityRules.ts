import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface EligibilityRule {
  _id: string
  ruleName: string
  description?: string
  mealSession: {
    id: string
    name: string
  }
  applicableFor: {
    shifts?: string[]
    departments?: string[]
    employeeTypes?: ('PERMANENT' | 'CONTRACT' | 'VENDOR')[]
    specificEmployees?: string[]
  }
  requiresAttendance: boolean
  requiresOT?: boolean
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function useEligibilityRules(filters?: any) {
  return useQuery({
    queryKey: ['eligibility-rules', filters],
    queryFn: () => api.getEligibilityRules(filters),
    staleTime: 30000,
  })
}

export function useEligibilityRule(id: string | null) {
  return useQuery({
    queryKey: ['eligibility-rule', id],
    queryFn: () => api.getEligibilityRule(id!),
    enabled: !!id,
  })
}

export function useCreateEligibilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.createEligibilityRule(data),
    onSuccess: () => {
      toast.success('Eligibility rule created successfully!')
      queryClient.invalidateQueries({ queryKey: ['eligibility-rules'] })
      queryClient.invalidateQueries({ queryKey: ['eligibility-rule-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create rule')
    },
  })
}

export function useUpdateEligibilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateEligibilityRule(id, data),
    onSuccess: (response, variables) => {
      toast.success('Eligibility rule updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['eligibility-rule', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['eligibility-rules'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update rule')
    },
  })
}

export function useDeleteEligibilityRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteEligibilityRule(id),
    onSuccess: () => {
      toast.success('Eligibility rule deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['eligibility-rules'] })
      queryClient.invalidateQueries({ queryKey: ['eligibility-rule-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete rule')
    },
  })
}

export function useEligibilityRuleStats() {
  return useQuery({
    queryKey: ['eligibility-rule-stats'],
    queryFn: () => api.getEligibilityRuleStats(),
    staleTime: 60000,
  })
}

export function useVerifyMealEligibility() {
  return useMutation({
    mutationFn: (data: { employeeId: string; mealSessionId: string; timestamp?: string }) =>
      api.verifyMealEligibility(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to verify eligibility')
    },
  })
}
