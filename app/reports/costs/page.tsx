'use client'

import { useState, useMemo } from 'react'
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

  // Commented out for demo with static data
  // const dates = useMemo(() => {
  //   return getDateRange(dateRange as any,
  //     customStartDate ? new Date(customStartDate) : undefined,
  //     customEndDate ? new Date(customEndDate) : undefined
  //   )
  // }, [dateRange, customStartDate, customEndDate])

  // const { data, isLoading } = useCostReports(dates)
  // const reportData = data?.data

  // Static demo data
  const isLoading = false
  const reportData = {
    costPerMeal: {
      totalMeals: 8542,
      totalCost: 427100,
      costPerMeal: 50.01
    },
    mealCostTrend: [
      { _id: '2025-10-01', totalCost: 12250, avgCost: 50.00 },
      { _id: '2025-10-02', totalCost: 13400, avgCost: 50.00 },
      { _id: '2025-10-03', totalCost: 14450, avgCost: 50.00 },
      { _id: '2025-10-04', totalCost: 15600, avgCost: 50.00 },
      { _id: '2025-10-05', totalCost: 13750, avgCost: 50.00 },
      { _id: '2025-10-06', totalCost: 9900, avgCost: 50.00 },
      { _id: '2025-10-07', totalCost: 9350, avgCost: 50.00 },
      { _id: '2025-10-08', totalCost: 12800, avgCost: 50.00 },
      { _id: '2025-10-09', totalCost: 13900, avgCost: 50.00 },
      { _id: '2025-10-10', totalCost: 14750, avgCost: 50.00 },
      { _id: '2025-10-11', totalCost: 15900, avgCost: 50.00 },
      { _id: '2025-10-12', totalCost: 14150, avgCost: 50.00 },
      { _id: '2025-10-13', totalCost: 10250, avgCost: 50.00 },
      { _id: '2025-10-14', totalCost: 9600, avgCost: 50.00 },
      { _id: '2025-10-15', totalCost: 13200, avgCost: 50.00 },
      { _id: '2025-10-16', totalCost: 14350, avgCost: 50.00 },
      { _id: '2025-10-17', totalCost: 15050, avgCost: 50.00 },
      { _id: '2025-10-18', totalCost: 16250, avgCost: 50.00 },
      { _id: '2025-10-19', totalCost: 14550, avgCost: 50.00 },
      { _id: '2025-10-20', totalCost: 10500, avgCost: 50.00 },
      { _id: '2025-10-21', totalCost: 9750, avgCost: 50.00 },
      { _id: '2025-10-22', totalCost: 13600, avgCost: 50.00 },
      { _id: '2025-10-23', totalCost: 14700, avgCost: 50.00 },
      { _id: '2025-10-24', totalCost: 15400, avgCost: 50.00 },
      { _id: '2025-10-25', totalCost: 16750, avgCost: 50.00 },
      { _id: '2025-10-26', totalCost: 14900, avgCost: 50.00 },
      { _id: '2025-10-27', totalCost: 10900, avgCost: 50.00 },
      { _id: '2025-10-28', totalCost: 10150, avgCost: 50.00 },
      { _id: '2025-10-29', totalCost: 14050, avgCost: 50.00 },
      { _id: '2025-10-30', totalCost: 15250, avgCost: 50.00 },
      { _id: '2025-10-31', totalCost: 16100, avgCost: 50.00 }
    ],
    vendorSpending: [
      { vendorName: 'Fresh Vegetables Ltd', totalSpent: 145680, orderCount: 45 },
      { vendorName: 'Prime Meat Suppliers', totalSpent: 132450, orderCount: 38 },
      { vendorName: 'Dairy Fresh Co', totalSpent: 98750, orderCount: 52 },
      { vendorName: 'Grain Traders Inc', totalSpent: 87320, orderCount: 28 },
      { vendorName: 'Spice Market', totalSpent: 65430, orderCount: 34 },
      { vendorName: 'Ocean Foods', totalSpent: 54210, orderCount: 22 },
      { vendorName: 'Bakery Supplies', totalSpent: 43580, orderCount: 31 },
      { vendorName: 'Beverage Distributors', totalSpent: 38920, orderCount: 27 }
    ],
    departmentCosts: [
      { departmentName: 'Production', totalCost: 107800, percent: 0.2524 },
      { departmentName: 'Engineering', totalCost: 92250, percent: 0.2159 },
      { departmentName: 'Quality Control', totalCost: 71600, percent: 0.1676 },
      { departmentName: 'Maintenance', totalCost: 54450, percent: 0.1275 },
      { departmentName: 'Administration', totalCost: 43800, percent: 0.1026 },
      { departmentName: 'Logistics', totalCost: 32700, percent: 0.0766 }
    ],
    billsAnalysis: [
      { _id: 'PAID', totalAmount: 356200, balanceAmount: 0, count: 42 },
      { _id: 'PARTIALLY_PAID', totalAmount: 125400, balanceAmount: 45600, count: 15 },
      { _id: 'UNPAID', totalAmount: 89300, balanceAmount: 89300, count: 12 }
    ],
    monthlyComparison: [
      { _id: { year: 2025, month: 7 }, totalCost: 389450, mealCount: 7890 },
      { _id: { year: 2025, month: 8 }, totalCost: 412300, mealCount: 8210 },
      { _id: { year: 2025, month: 9 }, totalCost: 405870, mealCount: 8156 },
      { _id: { year: 2025, month: 10 }, totalCost: 427100, mealCount: 8542 }
    ],
    inventoryCosts: [
      { _id: '2025-10-01', totalCost: 8450 },
      { _id: '2025-10-02', totalCost: 9120 },
      { _id: '2025-10-03', totalCost: 9870 },
      { _id: '2025-10-04', totalCost: 10250 },
      { _id: '2025-10-05', totalCost: 8950 },
      { _id: '2025-10-06', totalCost: 6780 },
      { _id: '2025-10-07', totalCost: 6320 },
      { _id: '2025-10-08', totalCost: 8890 },
      { _id: '2025-10-09', totalCost: 9450 },
      { _id: '2025-10-10', totalCost: 10100 },
      { _id: '2025-10-11', totalCost: 10890 },
      { _id: '2025-10-12', totalCost: 9640 },
      { _id: '2025-10-13', totalCost: 7120 },
      { _id: '2025-10-14', totalCost: 6850 },
      { _id: '2025-10-15', totalCost: 9230 },
      { _id: '2025-10-16', totalCost: 9780 },
      { _id: '2025-10-17', totalCost: 10320 },
      { _id: '2025-10-18', totalCost: 11150 },
      { _id: '2025-10-19', totalCost: 9920 },
      { _id: '2025-10-20', totalCost: 7340 },
      { _id: '2025-10-21', totalCost: 6980 },
      { _id: '2025-10-22', totalCost: 9450 },
      { _id: '2025-10-23', totalCost: 10020 },
      { _id: '2025-10-24', totalCost: 10560 },
      { _id: '2025-10-25', totalCost: 11450 },
      { _id: '2025-10-26', totalCost: 10180 },
      { _id: '2025-10-27', totalCost: 7560 },
      { _id: '2025-10-28', totalCost: 7210 },
      { _id: '2025-10-29', totalCost: 9670 },
      { _id: '2025-10-30', totalCost: 10430 },
      { _id: '2025-10-31', totalCost: 11020 }
    ]
  }

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
