import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface AccessControlRole {
  _id: string
  roleName: string
  description?: string
  permissions: string[]
  moduleAccess: Record<string, boolean>
  isActive: boolean
  isSystemRole: boolean
  createdAt: string
  updatedAt: string
}

export function useAccessControlRoles(filters?: any) {
  return useQuery({
    queryKey: ['access-control-roles', filters],
    queryFn: () => api.getAccessControlRoles(filters),
    staleTime: 30000,
  })
}

export function useAccessControlRole(id: string | null) {
  return useQuery({
    queryKey: ['access-control-role', id],
    queryFn: () => api.getAccessControlRole(id!),
    enabled: !!id,
  })
}

export function useCreateAccessControlRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.createAccessControlRole(data),
    onSuccess: () => {
      toast.success('Access control role created successfully!')
      queryClient.invalidateQueries({ queryKey: ['access-control-roles'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create role')
    },
  })
}

export function useUpdateAccessControlRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAccessControlRole(id, data),
    onSuccess: (response, variables) => {
      toast.success('Access control role updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['access-control-role', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['access-control-roles'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update role')
    },
  })
}

export function useDeleteAccessControlRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAccessControlRole(id),
    onSuccess: () => {
      toast.success('Access control role deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['access-control-roles'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete role')
    },
  })
}
