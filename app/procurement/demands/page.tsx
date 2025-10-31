'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePurchaseDemands, usePurchaseDemandStats } from '@/hooks/usePurchaseDemands'
import { format } from 'date-fns'

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PO_CREATED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export default function PurchaseDemandsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, isLoading } = usePurchaseDemands({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    limit: 100,
  })

  const { data: statsData, isLoading: statsLoading } = usePurchaseDemandStats()

  const demands = data?.data || []
  const stats = statsData?.data || { total: 0, draft: 0, submitted: 0, approved: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Demands</h1>
          <p className="text-muted-foreground">Manage purchase requisitions and demands</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Demand
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Demands</CardTitle>
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
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <AlertCircle className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.draft}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PO Created</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats.poCreated || 0}</div>
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
                placeholder="Search demands..."
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
          ) : demands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No demands found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Get started by creating a new demand</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demand Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Required By</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demands.map((demand: any) => (
                  <TableRow key={demand._id}>
                    <TableCell className="font-medium">{demand.demandNumber}</TableCell>
                    <TableCell>{format(new Date(demand.demandDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(new Date(demand.requiredByDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{demand.items?.length || 0} items</TableCell>
                    <TableCell>{demand.createdBy?.name}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[demand.finalStatus as keyof typeof STATUS_COLORS]}>
                        {demand.finalStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
