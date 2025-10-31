'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, DollarSign, TrendingDown, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { useCostReports, getDateRange, exportToCSV } from '@/hooks/useReports'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1']

export default function CostAnalysisPage() {
  const [dateRange, setDateRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const dates = getDateRange(dateRange as any,
    customStartDate ? new Date(customStartDate) : undefined,
    customEndDate ? new Date(customEndDate) : undefined
  )

  const { data, isLoading } = useCostReports(dates)
  const reportData = data?.data

  const handleExportVendors = () => {
    exportToCSV(reportData?.vendorSpending || [], 'vendor_spending_analysis')
  }

  const handleExportDepartments = () => {
    exportToCSV(reportData?.departmentCosts || [], 'department_cost_analysis')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Analysis & Financial Reports</h1>
          <p className="text-muted-foreground">Comprehensive financial insights and cost breakdowns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportVendors}>
            <Download className="mr-2 h-4 w-4" />
            Export Vendors
          </Button>
        </div>
      </div>

      {/* Date Range Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
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
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.costPerMeal?.totalMeals?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Meals served</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">₹{reportData?.costPerMeal?.totalCost?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total expenditure</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Per Meal</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">₹{reportData?.costPerMeal?.costPerMeal?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Average cost</p>
              </CardContent>
            </Card>
          </div>

          {/* Meal Cost & Procurement Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Trend Analysis</CardTitle>
              <CardDescription>Daily meal costs and procurement spending over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={reportData?.mealCostTrend || []}>
                  <defs>
                    <linearGradient id="colorTotalCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="totalCost" stroke="#3b82f6" fill="url(#colorTotalCost)" name="Meal Cost (₹)" />
                  <Line type="monotone" dataKey="avgCost" stroke="#10b981" strokeWidth={2} name="Avg Cost (₹)" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Vendor Spending & Department Costs */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Vendors by Spending */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Vendors by Spending</CardTitle>
                    <CardDescription>Procurement expenditure by vendor</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleExportVendors}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(reportData?.vendorSpending || []).slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="vendorName" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="totalSpent" fill="#8b5cf6" name="Total Spent (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department-wise Costs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Cost Distribution</CardTitle>
                    <CardDescription>Meal costs by department</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleExportDepartments}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(reportData?.departmentCosts || []).slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ departmentName, totalCost, percent }) => `${departmentName || 'Unknown'}: ₹${totalCost.toLocaleString()} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalCost"
                    >
                      {(reportData?.departmentCosts || []).slice(0, 6).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Bills Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle>Bills Payment Status</CardTitle>
              <CardDescription>Current payment status of vendor bills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                {(reportData?.billsAnalysis || []).map((status: any) => (
                  <Card key={status._id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Badge
                          className={
                            status._id === 'UNPAID' ? 'bg-red-100 text-red-800' :
                            status._id === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {status._id.replace(/_/g, ' ')}
                        </Badge>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">₹{status.totalAmount?.toLocaleString() || 0}</div>
                      <p className="text-xs text-muted-foreground mt-1">{status.count} bills</p>
                      {status.balanceAmount > 0 && (
                        <p className="text-xs text-red-600 mt-1">Balance: ₹{status.balanceAmount.toLocaleString()}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData?.billsAnalysis || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalAmount" fill="#3b82f6" name="Total Amount (₹)" />
                  <Bar dataKey="balanceAmount" fill="#ef4444" name="Balance Amount (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Comparison</CardTitle>
              <CardDescription>Month-over-month cost trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.monthlyComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={(item) => `${item._id.year}-${String(item._id.month).padStart(2, '0')}`} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalCost" fill="#10b981" name="Total Cost (₹)" />
                  <Bar dataKey="mealCount" fill="#f59e0b" name="Meal Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Consumption Costs */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Consumption Costs</CardTitle>
              <CardDescription>Daily inventory usage and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData?.inventoryCosts || []}>
                  <defs>
                    <linearGradient id="colorInventory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="totalCost" stroke="#ec4899" fillOpacity={1} fill="url(#colorInventory)" name="Cost (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
