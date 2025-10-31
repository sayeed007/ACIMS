'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, ShoppingCart, Loader2, Package, Truck } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePurchaseOrders, usePurchaseOrderStats } from '@/hooks/usePurchaseOrders'
import { format } from 'date-fns'

const STATUS_COLORS = {
  DRAFT: 'bg-slate-100 text-slate-800',
  APPROVED: 'bg-green-100 text-green-800',
  SENT_TO_VENDOR: 'bg-blue-100 text-blue-800',
  PARTIALLY_RECEIVED: 'bg-yellow-100 text-yellow-800',
  FULLY_RECEIVED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

export default function PurchaseOrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = usePurchaseOrders({
    search: searchQuery || undefined,
    limit: 100,
  })

  const { data: statsData, isLoading: statsLoading } = usePurchaseOrderStats()

  const orders = data?.data || []
  const stats = statsData?.data || { total: 0, draft: 0, approved: 0, fullyReceived: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and track deliveries</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New PO
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
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
            <Package className="h-4 w-4 text-slate-600" />
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
            <Truck className="h-4 w-4 text-green-600" />
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
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats.fullyReceived}</div>
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
                placeholder="Search purchase orders..."
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
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No purchase orders found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create a new PO to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: any) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">{order.poNumber}</TableCell>
                    <TableCell>{format(new Date(order.poDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>{order.vendor?.name}</TableCell>
                    <TableCell>{format(new Date(order.deliveryDate), 'dd MMM yyyy')}</TableCell>
                    <TableCell>₹{order.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}>
                        {order.status.replace(/_/g, ' ')}
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
