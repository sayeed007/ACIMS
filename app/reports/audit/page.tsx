'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Shield, Activity, Users, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuditLogs, getDateRange, exportToCSV } from '@/hooks/useReports'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1']

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  LOGIN: 'bg-purple-100 text-purple-800',
  LOGOUT: 'bg-gray-100 text-gray-800',
  VERIFY: 'bg-yellow-100 text-yellow-800',
  APPROVE: 'bg-emerald-100 text-emerald-800',
  REJECT: 'bg-orange-100 text-orange-800',
}

export default function AuditLogPage() {
  const [dateRange, setDateRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  // Commented out for demo with static data
  // const dates = useMemo(() => {
  //   return getDateRange(dateRange as any,
  //     customStartDate ? new Date(customStartDate) : undefined,
  //     customEndDate ? new Date(customEndDate) : undefined
  //   )
  // }, [dateRange, customStartDate, customEndDate])

  // const filters = useMemo(() => ({
  //   ...dates,
  //   action: actionFilter || undefined,
  //   module: moduleFilter || undefined,
  //   page,
  //   limit,
  // }), [dates, actionFilter, moduleFilter, page, limit])

  // const { data, isLoading } = useAuditLogs(filters)
  // const reportData = data?.data

  // Static demo data
  const isLoading = false
  const reportData = {
    logs: [
      {
        _id: '1',
        timestamp: '2025-10-31T14:30:25Z',
        action: 'CREATE',
        module: 'EMPLOYEE',
        description: 'Created new employee record for John Smith',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '2',
        timestamp: '2025-10-31T14:25:18Z',
        action: 'UPDATE',
        module: 'MEAL',
        description: 'Updated meal session timing for Lunch',
        ipAddress: '192.168.1.102',
        user: { name: 'Sarah Johnson' }
      },
      {
        _id: '3',
        timestamp: '2025-10-31T14:20:45Z',
        action: 'APPROVE',
        module: 'PROCUREMENT',
        description: 'Approved procurement request #PR-2025-142',
        ipAddress: '192.168.1.98',
        user: { name: 'Michael Chen' }
      },
      {
        _id: '4',
        timestamp: '2025-10-31T14:15:32Z',
        action: 'DELETE',
        module: 'INVENTORY',
        description: 'Deleted expired inventory item INV-5432',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '5',
        timestamp: '2025-10-31T14:10:55Z',
        action: 'LOGIN',
        module: 'AUTH',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.87',
        user: { name: 'David Park' }
      },
      {
        _id: '6',
        timestamp: '2025-10-31T14:05:12Z',
        action: 'VERIFY',
        module: 'ELIGIBILITY',
        description: 'Verified meal eligibility for EMP-2345',
        ipAddress: '192.168.1.76',
        user: { name: 'Emma Wilson' }
      },
      {
        _id: '7',
        timestamp: '2025-10-31T14:00:38Z',
        action: 'UPDATE',
        module: 'DEPARTMENT',
        description: 'Updated department budget allocation',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '8',
        timestamp: '2025-10-31T13:55:22Z',
        action: 'CREATE',
        module: 'PROCUREMENT',
        description: 'Created new procurement request for vegetables',
        ipAddress: '192.168.1.92',
        user: { name: 'Lisa Anderson' }
      },
      {
        _id: '9',
        timestamp: '2025-10-31T13:50:47Z',
        action: 'REJECT',
        module: 'PROCUREMENT',
        description: 'Rejected procurement request #PR-2025-139',
        ipAddress: '192.168.1.98',
        user: { name: 'Michael Chen' }
      },
      {
        _id: '10',
        timestamp: '2025-10-31T13:45:15Z',
        action: 'UPDATE',
        module: 'INVENTORY',
        description: 'Updated inventory stock levels',
        ipAddress: '192.168.1.92',
        user: { name: 'Lisa Anderson' }
      },
      {
        _id: '11',
        timestamp: '2025-10-31T13:40:28Z',
        action: 'LOGIN',
        module: 'AUTH',
        description: 'User logged in successfully',
        ipAddress: '192.168.1.102',
        user: { name: 'Sarah Johnson' }
      },
      {
        _id: '12',
        timestamp: '2025-10-31T13:35:55Z',
        action: 'CREATE',
        module: 'MEAL',
        description: 'Created new meal session for Night Shift',
        ipAddress: '192.168.1.102',
        user: { name: 'Sarah Johnson' }
      },
      {
        _id: '13',
        timestamp: '2025-10-31T13:30:10Z',
        action: 'UPDATE',
        module: 'ACCESS_CONTROL',
        description: 'Updated user permissions for role Manager',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '14',
        timestamp: '2025-10-31T13:25:42Z',
        action: 'VERIFY',
        module: 'ELIGIBILITY',
        description: 'Verified meal eligibility for EMP-2389',
        ipAddress: '192.168.1.76',
        user: { name: 'Emma Wilson' }
      },
      {
        _id: '15',
        timestamp: '2025-10-31T13:20:18Z',
        action: 'LOGOUT',
        module: 'AUTH',
        description: 'User logged out',
        ipAddress: '192.168.1.87',
        user: { name: 'David Park' }
      },
      {
        _id: '16',
        timestamp: '2025-10-31T13:15:50Z',
        action: 'CREATE',
        module: 'EMPLOYEE',
        description: 'Created new employee record for Jane Doe',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '17',
        timestamp: '2025-10-31T13:10:25Z',
        action: 'UPDATE',
        module: 'PROCUREMENT',
        description: 'Updated procurement vendor details',
        ipAddress: '192.168.1.92',
        user: { name: 'Lisa Anderson' }
      },
      {
        _id: '18',
        timestamp: '2025-10-31T13:05:38Z',
        action: 'DELETE',
        module: 'DEPARTMENT',
        description: 'Deleted inactive department',
        ipAddress: '192.168.1.105',
        user: { name: 'Admin User' }
      },
      {
        _id: '19',
        timestamp: '2025-10-31T13:00:12Z',
        action: 'APPROVE',
        module: 'PROCUREMENT',
        description: 'Approved procurement request #PR-2025-141',
        ipAddress: '192.168.1.98',
        user: { name: 'Michael Chen' }
      },
      {
        _id: '20',
        timestamp: '2025-10-31T12:55:45Z',
        action: 'VERIFY',
        module: 'ELIGIBILITY',
        description: 'Verified meal eligibility for EMP-2401',
        ipAddress: '192.168.1.76',
        user: { name: 'Emma Wilson' }
      }
    ],
    stats: {
      actionStats: [
        { _id: 'CREATE', count: 456, percent: 0.22 },
        { _id: 'UPDATE', count: 782, percent: 0.38 },
        { _id: 'DELETE', count: 89, percent: 0.04 },
        { _id: 'LOGIN', count: 345, percent: 0.17 },
        { _id: 'LOGOUT', count: 298, percent: 0.14 },
        { _id: 'VERIFY', count: 234, percent: 0.11 },
        { _id: 'APPROVE', count: 156, percent: 0.08 },
        { _id: 'REJECT', count: 67, percent: 0.03 }
      ],
      moduleStats: [
        { _id: 'MEAL', count: 892 },
        { _id: 'EMPLOYEE', count: 745 },
        { _id: 'PROCUREMENT', count: 623 },
        { _id: 'INVENTORY', count: 534 },
        { _id: 'AUTH', count: 456 },
        { _id: 'ELIGIBILITY', count: 389 },
        { _id: 'DEPARTMENT', count: 267 },
        { _id: 'ACCESS_CONTROL', count: 156 }
      ],
      topUsers: [
        { userName: 'Admin User', actionCount: 1245 },
        { userName: 'Sarah Johnson', actionCount: 892 },
        { userName: 'Michael Chen', actionCount: 734 },
        { userName: 'Lisa Anderson', actionCount: 623 },
        { userName: 'Emma Wilson', actionCount: 567 },
        { userName: 'David Park', actionCount: 445 },
        { userName: 'System', actionCount: 312 }
      ]
    },
    pagination: {
      total: 2047,
      page: 1,
      totalPages: 103
    }
  }

  const handleExportLogs = () => {
    exportToCSV(reportData?.logs || [], 'audit_logs')
  }

  const handleExportStats = (type: 'actions' | 'modules' | 'users') => {
    let exportData: any[] = []
    let filename = ''

    switch (type) {
      case 'actions':
        exportData = reportData?.stats?.actionStats || []
        filename = 'action_statistics'
        break
      case 'modules':
        exportData = reportData?.stats?.moduleStats || []
        filename = 'module_statistics'
        break
      case 'users':
        exportData = reportData?.stats?.topUsers || []
        filename = 'top_users'
        break
    }

    exportToCSV(exportData, filename)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const totalPages = reportData?.pagination?.totalPages || 1
  const currentPage = reportData?.pagination?.page || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log & System Activity</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filter Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="VERIFY">Verify</SelectItem>
                  <SelectItem value="APPROVE">Approve</SelectItem>
                  <SelectItem value="REJECT">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AUTH">Authentication</SelectItem>
                  <SelectItem value="EMPLOYEE">Employees</SelectItem>
                  <SelectItem value="DEPARTMENT">Departments</SelectItem>
                  <SelectItem value="MEAL">Meals</SelectItem>
                  <SelectItem value="INVENTORY">Inventory</SelectItem>
                  <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                  <SelectItem value="ELIGIBILITY">Eligibility</SelectItem>
                  <SelectItem value="ACCESS_CONTROL">Access Control</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.pagination?.total?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Action Types</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.stats?.actionStats?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Different action types</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.stats?.topUsers?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Users with activity</p>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Action Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Action Distribution</CardTitle>
                    <CardDescription>Breakdown by action type</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExportStats('actions')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData?.stats?.actionStats || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, count, percent }) => `${_id}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(reportData?.stats?.actionStats || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Module Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Module Activity</CardTitle>
                    <CardDescription>Activity by system module</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExportStats('modules')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(reportData?.stats?.moduleStats || []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="_id" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Activities" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Active Users */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Top Active Users</CardTitle>
                  <CardDescription>Users with most activities</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExportStats('users')}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.stats?.topUsers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actionCount" fill="#10b981" name="Actions" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Logs</CardTitle>
              <CardDescription>Detailed audit trail of system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Timestamp</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Module</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData?.logs || []).map((log: any) => (
                      <tr key={log._id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </td>
                        <td className="p-3">
                          <Badge className={ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline">{log.module}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {log.user?.name || 'System'}
                        </td>
                        <td className="p-3 text-sm">
                          {log.description || '-'}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {log.ipAddress || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {(!reportData?.logs || reportData.logs.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground">
                    No audit logs found for the selected filters
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({reportData?.pagination?.total} total records)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
