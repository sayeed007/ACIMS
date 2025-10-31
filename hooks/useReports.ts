import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

export function useMealReports(filters?: any) {
  return useQuery({
    queryKey: ['meal-reports', filters],
    queryFn: () => api.getMealReports(filters),
    staleTime: 60000, // 1 minute
  })
}

export function useCostReports(filters?: any) {
  return useQuery({
    queryKey: ['cost-reports', filters],
    queryFn: () => api.getCostReports(filters),
    staleTime: 60000,
  })
}

export function useAuditLogs(filters?: any) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => api.getAuditLogs(filters),
    staleTime: 30000,
  })
}

// Helper function to export data to CSV
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Helper to format date range for filters
export function getDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom', customStart?: Date, customEnd?: Date) {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (range) {
    case 'today':
      return {
        startDate: startOfDay.toISOString(),
        endDate: new Date(startOfDay.getTime() + 86400000).toISOString(),
      }
    case 'week':
      const weekStart = new Date(startOfDay)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      return {
        startDate: weekStart.toISOString(),
        endDate: now.toISOString(),
      }
    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: monthStart.toISOString(),
        endDate: now.toISOString(),
      }
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)
      return {
        startDate: quarterStart.toISOString(),
        endDate: now.toISOString(),
      }
    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return {
        startDate: yearStart.toISOString(),
        endDate: now.toISOString(),
      }
    case 'custom':
      return {
        startDate: customStart?.toISOString() || '',
        endDate: customEnd?.toISOString() || '',
      }
    default:
      return { startDate: '', endDate: '' }
  }
}
