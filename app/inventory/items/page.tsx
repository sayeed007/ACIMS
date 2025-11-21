'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Package, AlertTriangle, Pencil, Archive, Loader2, Upload, Download, Filter } from 'lucide-react'
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
import {
  useInventoryItems,
  useDeleteInventoryItem,
  useInventoryStats,
  type InventoryItem,
  type InventoryStats,
} from '@/hooks/useInventoryItems'
import { InventoryItemFormDialog } from '@/components/inventory/inventory-item-form-dialog'
import { InventoryItemImportDialog } from '@/components/inventory/inventory-item-import-dialog'
import { InventoryItemFilterDialog, type InventoryItemFilters } from '@/components/inventory/inventory-item-filter-dialog'
import { useAuth } from '@/lib/providers/auth-provider'
import { canAccess } from '@/lib/utils/permissions'
import { toast } from 'sonner'

export default function InventoryItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [itemToArchive, setItemToArchive] = useState<string | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState<InventoryItemFilters>({})

  const auth = useAuth()

  // Fetch inventory items with search filter and other filters
  const { data, isLoading, error } = useInventoryItems({
    search: searchQuery || undefined,
    ...(filters.category && { category: filters.category }),
    ...(filters.status && { status: filters.status }),
    ...(filters.lowStock && { lowStock: filters.lowStock }),
    limit: 50,
  })

  // Fetch inventory statistics
  const { data: statsData, isLoading: statsLoading } = useInventoryStats()

  // Delete mutation
  const deleteMutation = useDeleteInventoryItem()

  const items = data?.data || []
  const stats: InventoryStats = statsData ?? { total: 0, lowStock: 0, totalValue: 0 }

  // Check permissions using centralized utility
  const canCreateItem = canAccess.inventory.create(auth)
  const canEditItem = canAccess.inventory.edit(auth)
  const canDeleteItem = canAccess.inventory.delete(auth)

  // Handlers
  const handleCreateItem = () => {
    setDialogMode('create')
    setSelectedItem(null)
    setDialogOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    setDialogMode('edit')
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleArchiveClick = (itemId: string) => {
    setItemToArchive(itemId)
    setArchiveDialogOpen(true)
  }

  const handleArchiveConfirm = async () => {
    if (itemToArchive) {
      await deleteMutation.mutateAsync(itemToArchive)
      setArchiveDialogOpen(false)
      setItemToArchive(null)
    }
  }

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token')
      const queryParams = new URLSearchParams()

      if (searchQuery) {
        queryParams.append('search', searchQuery)
      }
      if (filters.category) {
        queryParams.append('category', filters.category)
      }
      if (filters.status) {
        queryParams.append('status', filters.status)
      }
      if (filters.lowStock) {
        queryParams.append('lowStock', 'true')
      }

      const response = await fetch(`/api/inventory/items/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Export failed')
      }

      // Get the blob from response
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory_items_export_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Inventory items exported successfully!')
    } catch (error: any) {
      console.error('Export error:', error)
      toast.error(error.message || 'Failed to export inventory items')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Items</h1>
          <p className="text-muted-foreground">
            Manage your inventory items and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateItem && (
            <>
              <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button onClick={handleCreateItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.lowStock}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Stock Value
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setFilterDialogOpen(true)}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
                <p className="mt-4 text-sm text-muted-foreground">Loading inventory items...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading inventory items</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No items found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new inventory item'}
              </p>
              {!searchQuery && canCreateItem && (
                <Button className="mt-4" onClick={handleCreateItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
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
                  <TableHead>Unit</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min. Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLowStock = item.currentStock <= item.reorderLevel
                  return (
                    <TableRow key={item._id}>
                      <TableCell className="font-medium">{item.itemCode}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category.name}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={isLowStock ? 'text-orange-600 font-semibold' : ''}>
                            {item.currentStock}
                          </span>
                          {isLowStock && (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.reorderLevel}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {item.status.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEditItem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteItem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchiveClick(item._id)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Archive item"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inventory Item Form Dialog */}
      <InventoryItemFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={selectedItem}
        mode={dialogMode}
      />

      {/* Inventory Item Import Dialog */}
      <InventoryItemImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      {/* Inventory Item Filter Dialog */}
      <InventoryItemFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Inventory Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the inventory item and mark it as inactive. The item
              will be hidden from the active list but can be restored later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                'Archive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
