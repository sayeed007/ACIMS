import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'

export interface Vendor {
  _id: string
  vendorCode: string
  name: string
  category: 'FOOD' | 'BEVERAGE' | 'INGREDIENTS' | 'PACKAGING' | 'EQUIPMENT' | 'SERVICES' | 'OTHER'
  contactPerson: {
    name: string
    designation?: string
    phone: string
    email: string
    alternatePhone?: string
  }
  address: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  businessDetails: {
    gstNumber?: string
    panNumber?: string
    registrationType?: 'REGISTERED' | 'UNREGISTERED' | 'COMPOSITION'
    businessType?: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'LLP'
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    ifscCode: string
    bankName: string
    branch: string
  }
  paymentTerms: {
    creditDays: number
    paymentMode: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'ONLINE'
    advancePercentage?: number
  }
  rating?: {
    quality: number
    delivery: number
    pricing: number
    overall: number
  }
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED'
  notes?: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export interface VendorFilters {
  category?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export interface CreateVendorData {
  vendorCode?: string // Optional - will be auto-generated if not provided
  name: string
  category: 'FOOD' | 'BEVERAGE' | 'INGREDIENTS' | 'PACKAGING' | 'EQUIPMENT' | 'SERVICES' | 'OTHER'
  contactPerson: {
    name: string
    designation?: string
    phone: string
    email: string
    alternatePhone?: string
  }
  address: {
    street: string
    city: string
    state: string
    pincode: string
    country: string
  }
  businessDetails?: {
    gstNumber?: string
    panNumber?: string
    registrationType?: 'REGISTERED' | 'UNREGISTERED' | 'COMPOSITION'
    businessType?: 'PROPRIETORSHIP' | 'PARTNERSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'LLP'
  }
  bankDetails?: {
    accountName: string
    accountNumber: string
    ifscCode: string
    bankName: string
    branch: string
  }
  paymentTerms?: {
    creditDays?: number
    paymentMode?: 'CASH' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'UPI' | 'ONLINE'
    advancePercentage?: number
  }
  rating?: {
    quality?: number
    delivery?: number
    pricing?: number
  }
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLACKLISTED'
  notes?: string
}

export interface UpdateVendorData extends Partial<CreateVendorData> {}

/**
 * Hook to fetch vendors list with filters
 */
export function useVendors(filters?: VendorFilters) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => api.getVendors(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single vendor by ID
 */
export function useVendor(id: string | null) {
  return useQuery({
    queryKey: ['vendor', id],
    queryFn: () => api.getVendor(id!),
    enabled: !!id,
  })
}

/**
 * Hook to create a new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVendorData) => api.createVendor(data),
    onSuccess: () => {
      toast.success('Vendor created successfully!')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to create vendor'
      toast.error(message)
    },
  })
}

/**
 * Hook to update an existing vendor
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorData }) =>
      api.updateVendor(id, data),
    onSuccess: (response, variables) => {
      toast.success('Vendor updated successfully!')
      queryClient.invalidateQueries({ queryKey: ['vendor', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update vendor'
      toast.error(message)
    },
  })
}

/**
 * Hook to delete a vendor
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.deleteVendor(id),
    onSuccess: () => {
      toast.success('Vendor deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] })
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to delete vendor'
      toast.error(message)
    },
  })
}

/**
 * Hook to get vendor statistics
 */
export function useVendorStats(filters?: VendorFilters) {
  return useQuery({
    queryKey: ['vendor-stats', filters],
    queryFn: async () => {
      const [allVendors, activeVendors, suspendedVendors] = await Promise.all([
        api.getVendors(filters),
        api.getVendors({ ...filters, status: 'ACTIVE' }),
        api.getVendors({ ...filters, status: 'SUSPENDED' }),
      ])

      return {
        total: allVendors.meta?.pagination?.total || 0,
        active: activeVendors.meta?.pagination?.total || 0,
        suspended: suspendedVendors.meta?.pagination?.total || 0,
      }
    },
    staleTime: 5000, // 5 seconds
  })
}
