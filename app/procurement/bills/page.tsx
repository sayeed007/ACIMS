'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Loader2, DollarSign, AlertCircle, Pencil, Send, CheckCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useBills, useBillStats, useUpdateBill } from '@/hooks/useBills'
import { BillFormDialog } from '@/components/procurement/bill-form-dialog'
import { format } from 'date-fns'

const PAYMENT_STATUS_COLORS = {
  UNPAID: 'bg-red-100 text-red-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  FULLY_PAID: 'bg-green-100 text-green-800',
}

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  POSTED: 'bg-purple-100 text-purple-800',
}

export default function BillsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const { data, isLoading } = useBills({
    search: searchQuery || undefined,
    limit: 100,
  })

  const { data: statsData, isLoading: statsLoading } = useBillStats()
  const updateMutation = useUpdateBill()

  const bills = data?.data || []
  const stats = (statsData?.data as any) || { total: 0, unpaid: 0, partiallyPaid: 0, fullyPaid: 0, totalOutstanding: 0 }

  const handleCreate = () => {
    setSelectedBill(null)
    setFormMode('create')
    setFormOpen(true)
  }

  const handleEdit = (bill: any) => {
    setSelectedBill(bill)
    setFormMode('edit')
    setFormOpen(true)
  }

  const handleSubmit = async (billId: string) => {
    await updateMutation.mutateAsync({
      id: billId,
      data: { status: 'SUBMITTED' },
    })
  }

  const handleApprove = async (billId: string) => {
    await updateMutation.mutateAsync({
      id: billId,
      data: { status: 'APPROVED' },
    })
  }

  const handlePost = async (billId: string) => {
    await updateMutation.mutateAsync({
      id: billId,
      data: { status: 'POSTED' },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills Management</h1>
          <p className="text-muted-foreground">Track vendor bills and payments</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Bill
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.fullyPaid}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-orange-600">₹{(stats.totalOutstanding || 0).toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No bills found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Record a new bill to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill: any) => (
                  <TableRow key={bill._id}>
                    <TableCell className="font-medium">{bill.billNumber}</TableCell>
                    <TableCell>{format(new Date(bill.billDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{bill.vendor?.name}</TableCell>
                    <TableCell>{format(new Date(bill.dueDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>₹{bill.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>₹{bill.balanceAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={PAYMENT_STATUS_COLORS[bill.paymentStatus as keyof typeof PAYMENT_STATUS_COLORS]}>
                        {bill.paymentStatus.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[bill.status as keyof typeof STATUS_COLORS]}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit button for DRAFT bills */}
                        {bill.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(bill)}
                            title="Edit bill"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Submit button for DRAFT bills */}
                        {bill.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSubmit(bill._id)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Submit bill for approval"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Approve button for SUBMITTED bills */}
                        {bill.status === 'SUBMITTED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(bill._id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Approve bill"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Post button for APPROVED bills */}
                        {bill.status === 'APPROVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePost(bill._id)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            title="Post bill to accounts"
                          >
                            <CheckCircle className="h-4 w-4" />
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

      <BillFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        bill={selectedBill}
        mode={formMode}
      />
    </div>
  )
}
