'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3, Loader2 } from 'lucide-react'
import { useMealReports, getDateRange, exportToCSV } from '@/hooks/useReports'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1']

export default function MealReportsPage() {
  const [dateRange, setDateRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const dates = getDateRange(dateRange as any,
    customStartDate ? new Date(customStartDate) : undefined,
    customEndDate ? new Date(customEndDate) : undefined
  )

  const { data, isLoading } = useMealReports(dates)
  const reportData = data?.data

  const handleExport = (type: 'daily' | 'session' | 'department' | 'shift') => {
    let exportData: any[] = []
    let filename = ''

    switch (type) {
      case 'daily':
        exportData = reportData?.dailyTrend || []
        filename = 'daily_meal_trend'
        break
      case 'session':
        exportData = reportData?.mealsBySession || []
        filename = 'meals_by_session'
        break
      case 'department':
        exportData = reportData?.mealsByDepartment || []
        filename = 'meals_by_department'
        break
      case 'shift':
        exportData = reportData?.mealsByShift || []
        filename = 'meals_by_shift'
        break
    }

    exportToCSV(exportData, filename)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive meal distribution insights with visual analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('daily')}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
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
          {/* Summary Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meals Served</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{reportData?.summary?.totalMeals?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">In selected period</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{reportData?.summary?.totalCost?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Total expenditure</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Cost Per Meal</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₹{reportData?.summary?.avgCostPerMeal?.toFixed(2) || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Average per meal</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Meal Distribution Trend</CardTitle>
              <CardDescription>Meals served per day over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={reportData?.dailyTrend || []}>
                  <defs>
                    <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMeals)" name="Meals" />
                  <Area yAxisId="right" type="monotone" dataKey="totalCost" stroke="#10b981" fillOpacity={1} fill="url(#colorCost)" name="Cost (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Meals by Session & Department - Side by Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Meals by Session */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meals by Session</CardTitle>
                    <CardDescription>Distribution across meal sessions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('session')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData?.mealsBySession || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ sessionName, count, percent }) => `${sessionName}: ${count} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {(reportData?.mealsBySession || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Meals by Department */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Top Departments by Meals</CardTitle>
                    <CardDescription>Department-wise meal consumption</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('department')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={(reportData?.mealsByDepartment || []).slice(0, 6)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="departmentName" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" name="Meals" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Meal Distribution</CardTitle>
              <CardDescription>Peak hours for meal service</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData?.hourlyDistribution || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Number of Meals', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" name="Meals" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Shift-wise Distribution */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Meals by Shift</CardTitle>
                  <CardDescription>Shift-wise meal distribution comparison</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleExport('shift')}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData?.mealsByShift || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shiftName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#f59e0b" name="Meal Count" />
                  <Bar dataKey="totalCost" fill="#10b981" name="Total Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
