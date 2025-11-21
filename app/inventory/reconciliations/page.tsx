'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Search,
  FileText,
  CheckCircle,
  Clock,
  Loader2,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Pencil,
  Send,
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
  useReconciliations,
  useDeleteReconciliation,
  useReconciliationStats,
  useUpdateReconciliation,
  type Reconciliation,
} from '@/hooks/useReconciliations'
import { ReconciliationFormDialog } from '@/components/inventory/reconciliation-form-dialog'
import { useAuth } from '@/lib/providers/auth-provider'

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  VERIFIED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
}

export default function ReconciliationsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reconciliationToDelete, setReconciliationToDelete] = useState<string | null>(null)

  const { user, hasPermission } = useAuth()

  // Fetch reconciliations with filters
  const { data, isLoading, error } = useReconciliations({
    status: statusFilter || undefined,
    limit: 100,
  })

  // Fetch reconciliation statistics
  const { data: statsData, isLoading: statsLoading } = useReconciliationStats()

  // Delete mutation
  const deleteMutation = useDeleteReconciliation()
  const updateMutation = useUpdateReconciliation()

  const reconciliations = data?.data || []
  const stats = statsData || { total: 0, draft: 0, completed: 0 }

  // Check permissions
  const canCreateReconciliation =
    hasPermission('inventory:create') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'STORE_KEEPER'
  const canApproveReconciliation =
    hasPermission('inventory:approve') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'
  const canDeleteReconciliation =
    hasPermission('inventory:delete') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN'

  // Handlers
  const handleCreateReconciliation = () => {
    setDialogMode('create')
    setSelectedReconciliation(null)
    setDialogOpen(true)
  }

  const handleEditReconciliation = (reconciliation: Reconciliation) => {
    setDialogMode('edit')
    setSelectedReconciliation(reconciliation)
    setDialogOpen(true)
  }

  const handleDeleteClick = (reconciliationId: string) => {
    setReconciliationToDelete(reconciliationId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (reconciliationToDelete) {
      await deleteMutation.mutateAsync(reconciliationToDelete)
      setDeleteDialogOpen(false)
      setReconciliationToDelete(null)
    }
  }

  const handleApprove = async (reconciliationId: string) => {
    await updateMutation.mutateAsync({
      id: reconciliationId,
      data: { approve: true },
    })
  }

  const handleReject = async (reconciliationId: string) => {
    await updateMutation.mutateAsync({
      id: reconciliationId,
      data: { reject: true },
    })
  }

  const handleSubmit = async (reconciliationId: string) => {
    await updateMutation.mutateAsync({
      id: reconciliationId,
      data: { status: 'SUBMITTED' },
    })
  }

  const handleClearFilters = () => {
    setStatusFilter('')
    setSearchQuery('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Filter reconciliations by search query
  const filteredReconciliations = reconciliations.filter((reconciliation: Reconciliation) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      reconciliation.item.name.toLowerCase().includes(query) ||
      reconciliation.item.itemCode.toLowerCase().includes(query) ||
      reconciliation.location?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Reconciliation</h1>
          <p className="text-muted-foreground">
            Compare physical stock counts with system records
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateReconciliation && (
            <Button onClick={handleCreateReconciliation}>
              <Plus className="mr-2 h-4 w-4" />
              New Reconciliation
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Reconciliations
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">All reconciliation records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
            )}
            <p className="text-xs text-muted-foreground">Draft reconciliations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            )}
            <p className="text-xs text-muted-foreground">Completed with adjustments</p>
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
                  placeholder="Search by item name, code, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
              {(statusFilter || searchQuery) && (
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
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading reconciliations...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading reconciliations</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : filteredReconciliations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No reconciliations found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery || statusFilter
                  ? 'Try adjusting your filters'
                  : 'Get started by creating a new reconciliation'}
              </p>
              {!searchQuery && !statusFilter && canCreateReconciliation && (
                <Button className="mt-4" onClick={handleCreateReconciliation}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Reconciliation
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
                    <TableHead className="text-right">System Stock</TableHead>
                    <TableHead className="text-right">Physical Stock</TableHead>
                    <TableHead className="text-right">Discrepancy</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReconciliations.map((reconciliation: Reconciliation) => (
                    <TableRow key={reconciliation._id}>
                      <TableCell className="font-medium">
                        {formatDate(reconciliation.reconciliationDate)}
                      </TableCell>
                      <TableCell>{reconciliation.item.itemCode}</TableCell>
                      <TableCell>{reconciliation.item.name}</TableCell>
                      <TableCell className="text-right">
                        {reconciliation.systemStock} {reconciliation.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {reconciliation.physicalStock} {reconciliation.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {reconciliation.discrepancy !== 0 && (
                            <>
                              {reconciliation.discrepancy > 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              )}
                            </>
                          )}
                          <span
                            className={`font-semibold ${
                              reconciliation.discrepancy > 0
                                ? 'text-green-600'
                                : reconciliation.discrepancy < 0
                                ? 'text-red-600'
                                : 'text-slate-600'
                            }`}
                          >
                            {reconciliation.discrepancy > 0 ? '+' : ''}
                            {reconciliation.discrepancy} {reconciliation.unit}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground text-right">
                          ({reconciliation.discrepancyPercentage.toFixed(1)}%)
                        </div>
                      </TableCell>
                      <TableCell>
                        {reconciliation.location || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{reconciliation.performedBy.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {reconciliation.performedBy.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[reconciliation.status]}>
                          {reconciliation.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Edit button for DRAFT reconciliations */}
                          {canCreateReconciliation && reconciliation.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReconciliation(reconciliation)}
                              title="Edit reconciliation"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Submit for Review button for DRAFT reconciliations */}
                          {canCreateReconciliation && reconciliation.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSubmit(reconciliation._id)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Submit for review"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Approve/Reject buttons for VERIFIED reconciliations */}
                          {canApproveReconciliation &&
                            reconciliation.status === 'VERIFIED' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(reconciliation._id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(reconciliation._id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                          {/* Delete button for DRAFT/REJECTED reconciliations */}
                          {canDeleteReconciliation &&
                            (reconciliation.status === 'DRAFT' ||
                              reconciliation.status === 'REJECTED') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(reconciliation._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete reconciliation"
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

      {/* Reconciliation Form Dialog */}
      <ReconciliationFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reconciliation={selectedReconciliation}
        mode={dialogMode}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the reconciliation record. This action cannot be undone.
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
