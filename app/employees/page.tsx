'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Users, Upload, Pencil, Trash2, Loader2, Filter, Download, X } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useEmployees, useDeleteEmployee, useEmployeeStats, type Employee } from '@/hooks/useEmployees'
import { EmployeeFormDialog } from '@/components/employees/employee-form-dialog'
import { EmployeeImportDialog } from '@/components/employees/employee-import-dialog'
import { EmployeeFilterDialog, type EmployeeFilters } from '@/components/employees/employee-filter-dialog'
import { useAuth } from '@/lib/providers/auth-provider'
import { useDepartments } from '@/hooks/useDepartments'
import { useShifts } from '@/hooks/useShifts'
import { toast } from 'sonner'

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState<EmployeeFilters>({})
  const [isExporting, setIsExporting] = useState(false)

  const { user, hasPermission } = useAuth()

  // Fetch departments and shifts for filter labels
  const { data: departmentsData } = useDepartments({ limit: 100 })
  const { data: shiftsData } = useShifts({ limit: 100 })

  const departments = departmentsData?.data || []
  const shifts = shiftsData?.data || []

  // Fetch employees with search filter and other filters
  const { data, isLoading, error } = useEmployees({
    ...(searchQuery && { search: searchQuery }),
    ...(filters.departmentId && { departmentId: filters.departmentId }),
    ...(filters.shiftId && { shiftId: filters.shiftId }),
    ...(filters.employmentType && { employmentType: filters.employmentType }),
    ...(filters.status && { status: filters.status }),
    limit: 50,
    status: filters.status || 'all', // Pass 'all' to get employees with all statuses
  })

  // Fetch employee statistics
  const { data: statsData, isLoading: statsLoading } = useEmployeeStats()

  // Delete mutation
  const deleteMutation = useDeleteEmployee()

  const employees = data?.data || []
  const stats = statsData || { total: 0, active: 0, contract: 0 }

  // Check permissions
  const canCreateEmployee = hasPermission('employee:create') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN'
  const canEditEmployee = hasPermission('employee:update') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN'
  const canDeleteEmployee = hasPermission('employee:delete') || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN'

  // Handlers
  const handleCreateEmployee = () => {
    setDialogMode('create')
    setSelectedEmployee(null)
    setDialogOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setDialogMode('edit')
    setSelectedEmployee(employee)
    setDialogOpen(true)
  }

  const handleDeleteClick = (employeeId: string) => {
    setEmployeeToDelete(employeeId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (employeeToDelete) {
      await deleteMutation.mutateAsync(employeeToDelete)
      setDeleteDialogOpen(false)
      setEmployeeToDelete(null)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Build query params
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (filters.departmentId) params.append('departmentId', filters.departmentId)
      if (filters.shiftId) params.append('shiftId', filters.shiftId)
      if (filters.employmentType) params.append('employmentType', filters.employmentType)
      if (filters.status) params.append('status', filters.status)

      const token = localStorage.getItem('token')
      const response = await fetch(`/api/employees/export?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to export employees')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `employees_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Employees exported successfully!')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export employees')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFiltersChange = (newFilters: EmployeeFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilter = (key: keyof EmployeeFilters) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
  }

  const handleClearAllFilters = () => {
    setFilters({})
  }

  const getFilterLabel = (key: keyof EmployeeFilters, value: string) => {
    switch (key) {
      case 'departmentId':
        const dept = departments.find((d) => d._id === value)
        return dept ? dept.name : 'Department'
      case 'shiftId':
        const shift = shifts.find((s) => s._id === value)
        return shift ? shift.name : 'Shift'
      case 'employmentType':
        return value.replace('_', ' ')
      case 'status':
        return value
      default:
        return value
    }
  }

  const activeFiltersCount = Object.keys(filters).filter(
    (key) => filters[key as keyof EmployeeFilters]
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage employee profiles and access
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateEmployee && (
            <>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button onClick={handleCreateEmployee}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total registered employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.active}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vendor Staff
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.contract}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Contract employees
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>
                <Filter className="mr-2 h-4 w-4" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={isExporting || employees.length === 0}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </>
                )}
              </Button>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {Object.entries(filters).map(
                  ([key, value]) =>
                    value && (
                      <Badge key={key} variant="secondary" className="gap-1">
                        {getFilterLabel(key as keyof EmployeeFilters, value)}
                        <button
                          onClick={() => handleClearFilter(key as keyof EmployeeFilters)}
                          className="ml-1 hover:bg-slate-300 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="h-6 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
                <p className="mt-4 text-sm text-muted-foreground">Loading employees...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading employees</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No employees found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new employee'}
              </p>
              {!searchQuery && canCreateEmployee && (
                <Button className="mt-4" onClick={handleCreateEmployee}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell className="font-medium">{employee.employeeId}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.email || '-'}</TableCell>
                    <TableCell>{employee.department.name}</TableCell>
                    <TableCell>{employee.shift.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {employee.employmentType.replace('_', ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === 'ACTIVE'
                            ? 'default'
                            : employee.status === 'INACTIVE'
                              ? 'secondary'
                              : 'destructive'
                        }
                        className="capitalize"
                      >
                        {employee.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditEmployee && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteEmployee && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(employee._id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Employee Form Dialog */}
      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        mode={dialogMode}
      />

      {/* Employee Import Dialog */}
      <EmployeeImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Employee Filter Dialog */}
      <EmployeeFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the employee record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
