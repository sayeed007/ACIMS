'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  useVendors,
  useDeleteVendor,
  useVendorStats,
  type Vendor,
} from '@/hooks/useVendors'
import { VendorFormDialog } from '@/components/procurement/vendor-form-dialog'
import { useAuth } from '@/lib/providers/auth-provider'

const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INACTIVE: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  BLACKLISTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null)

  const { user, hasPermission } = useAuth()

  // Fetch vendors with filters
  const { data, isLoading, error } = useVendors({
    search: searchQuery || undefined,
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
    limit: 100,
  })

  // Fetch vendor statistics
  const { data: statsData, isLoading: statsLoading } = useVendorStats()

  // Delete mutation
  const deleteMutation = useDeleteVendor()

  const vendors = data?.data || []
  const stats = statsData || { total: 0, active: 0, suspended: 0 }

  // Check permissions
  const canCreateVendor =
    hasPermission('procurement:create') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'
  const canEditVendor =
    hasPermission('procurement:update') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'
  const canDeleteVendor =
    hasPermission('procurement:delete') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'

  // Handlers
  const handleCreateVendor = () => {
    setDialogMode('create')
    setSelectedVendor(null)
    setDialogOpen(true)
  }

  const handleEditVendor = (vendor: Vendor) => {
    setDialogMode('edit')
    setSelectedVendor(vendor)
    setDialogOpen(true)
  }

  const handleDeleteClick = (vendorId: string) => {
    setVendorToDelete(vendorId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (vendorToDelete) {
      await deleteMutation.mutateAsync(vendorToDelete)
      setDeleteDialogOpen(false)
      setVendorToDelete(null)
    }
  }

  const handleClearFilters = () => {
    setCategoryFilter('')
    setStatusFilter('')
    setSearchQuery('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your supplier and vendor information
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateVendor && (
            <Button onClick={handleCreateVendor}>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">All registered vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            )}
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats.suspended}</div>
            )}
            <p className="text-xs text-muted-foreground">Temporarily suspended</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FOOD">Food</SelectItem>
                <SelectItem value="BEVERAGE">Beverage</SelectItem>
                <SelectItem value="INGREDIENTS">Ingredients</SelectItem>
                <SelectItem value="PACKAGING">Packaging</SelectItem>
                <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                <SelectItem value="SERVICES">Services</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
            {(categoryFilter || statusFilter || searchQuery) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
                <p className="mt-4 text-sm text-muted-foreground">Loading vendors...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading vendors</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No vendors found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || categoryFilter || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by adding a new vendor'}
              </p>
              {!searchQuery && !categoryFilter && !statusFilter && canCreateVendor && (
                <Button className="mt-4" onClick={handleCreateVendor}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vendor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor: Vendor) => (
                  <TableRow key={vendor._id}>
                    <TableCell className="font-medium">{vendor.vendorCode}</TableCell>
                    <TableCell>{vendor.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{vendor.category}</Badge>
                    </TableCell>
                    <TableCell>{vendor.contactPerson.name}</TableCell>
                    <TableCell>{vendor.contactPerson.phone}</TableCell>
                    <TableCell>{vendor.address.city}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[vendor.status]}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditVendor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditVendor(vendor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteVendor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(vendor._id)}
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

      {/* Vendor Form Dialog */}
      <VendorFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendor={selectedVendor}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the vendor. This action cannot be undone.
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
