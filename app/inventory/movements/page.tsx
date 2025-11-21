'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Loader2,
  Pencil,
  Trash2,
  Filter,
  Download,
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
  useStockMovements,
  useDeleteStockMovement,
  useStockMovementStats,
  type StockMovement,
} from '@/hooks/useStockMovements'
import { StockMovementFormDialog } from '@/components/inventory/stock-movement-form-dialog'
import { useAuth } from '@/lib/providers/auth-provider'
import { canAccess } from '@/lib/utils/permissions'

const MOVEMENT_TYPE_COLORS = {
  IN: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  OUT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ADJUSTMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TRANSFER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  RETURN: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function StockMovementsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [movementToDelete, setMovementToDelete] = useState<string | null>(null)

  const auth = useAuth()

  // Fetch stock movements with filters
  const { data, isLoading, error } = useStockMovements({
    movementType: movementTypeFilter || undefined,
    status: statusFilter || undefined,
    limit: 100,
  })

  // Fetch movement statistics
  const { data: statsData, isLoading: statsLoading } = useStockMovementStats()

  // Delete mutation
  const deleteMutation = useDeleteStockMovement()

  const movements = data?.data || []
  const stats = statsData || { total: 0, in: 0, out: 0 }

  // Check permissions using centralized utility
  const canCreateMovement = canAccess.stockMovements.create(auth)
  const canEditMovement = canAccess.stockMovements.edit(auth)
  const canDeleteMovement = canAccess.stockMovements.delete(auth)

  // Handlers
  const handleRecordMovement = () => {
    setDialogMode('create')
    setSelectedMovement(null)
    setDialogOpen(true)
  }

  const handleEditMovement = (movement: StockMovement) => {
    setDialogMode('edit')
    setSelectedMovement(movement)
    setDialogOpen(true)
  }

  const handleDeleteClick = (movementId: string) => {
    setMovementToDelete(movementId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (movementToDelete) {
      await deleteMutation.mutateAsync(movementToDelete)
      setDeleteDialogOpen(false)
      setMovementToDelete(null)
    }
  }

  const handleClearFilters = () => {
    setMovementTypeFilter('')
    setStatusFilter('')
    setSearchQuery('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Filter movements by search query
  const filteredMovements = movements.filter((movement: StockMovement) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      movement.item.name.toLowerCase().includes(query) ||
      movement.item.itemCode.toLowerCase().includes(query) ||
      movement.referenceNumber?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">
            Track all inventory stock movements and transactions
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateMovement && (
            <Button onClick={handleRecordMovement}>
              <Plus className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movements</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All stock transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock In</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.in}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Incoming stock movements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.out}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Outgoing stock movements
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by item name, code, or reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Movement Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {(movementTypeFilter || statusFilter || searchQuery) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
                <p className="mt-4 text-sm text-muted-foreground">Loading stock movements...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading stock movements</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No movements found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || movementTypeFilter || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by recording a new stock movement'}
              </p>
              {!searchQuery && !movementTypeFilter && !statusFilter && canCreateMovement && (
                <Button className="mt-4" onClick={handleRecordMovement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Movement
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-center">Stock Before</TableHead>
                    <TableHead className="text-center">Stock After</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement: StockMovement) => (
                    <TableRow key={movement._id}>
                      <TableCell className="font-medium">
                        {formatDate(movement.transactionDate)}
                      </TableCell>
                      <TableCell>{movement.item.itemCode}</TableCell>
                      <TableCell>{movement.item.name}</TableCell>
                      <TableCell>
                        <Badge className={MOVEMENT_TYPE_COLORS[movement.movementType]}>
                          {movement.movementType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        <span
                          className={
                            movement.movementType === 'IN' || movement.movementType === 'RETURN'
                              ? 'text-green-600'
                              : movement.movementType === 'OUT'
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {movement.movementType === 'IN' || movement.movementType === 'RETURN'
                            ? '+'
                            : movement.movementType === 'OUT'
                            ? '-'
                            : ''}
                          {Math.abs(movement.quantity)} {movement.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.stockBefore} {movement.unit}
                      </TableCell>
                      <TableCell className="text-center">
                        {movement.stockAfter} {movement.unit}
                      </TableCell>
                      <TableCell>
                        {movement.referenceNumber ? (
                          <div className="text-sm">
                            <div className="font-medium">{movement.referenceNumber}</div>
                            {movement.referenceType && (
                              <div className="text-xs text-muted-foreground">
                                {movement.referenceType.replace('_', ' ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{movement.performedBy.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.performedBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[movement.status]}>
                          {movement.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEditMovement && movement.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMovement(movement)}
                              title="Edit movement"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteMovement && movement.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(movement._id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete movement"
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Movement Form Dialog */}
      <StockMovementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movement={selectedMovement}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the stock movement record. This action cannot be undone and may affect inventory calculations.
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
