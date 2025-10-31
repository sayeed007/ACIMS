'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useEligibilityRules, useEligibilityRuleStats } from '@/hooks/useEligibilityRules'

const STATUS_COLORS = {
  true: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  false: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function EligibilityPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useEligibilityRules({
    search: searchQuery || undefined,
    limit: 100,
  })

  const { data: statsData, isLoading: statsLoading } = useEligibilityRuleStats()

  const rules = data?.data || []
  const stats = statsData?.data || { total: 0, active: 0, inactive: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Eligibility Rules</h1>
          <p className="text-muted-foreground">Define who can access which meals and when</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Rules</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
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
                placeholder="Search eligibility rules..."
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
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No eligibility rules found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create a new rule to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Meal Session</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Requires Attendance</TableHead>
                  <TableHead>Requires OT</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule: any) => (
                  <TableRow key={rule._id}>
                    <TableCell className="font-medium">{rule.ruleName}</TableCell>
                    <TableCell>{rule.mealSession?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {rule.requiresAttendance ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      {rule.requiresOT ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[rule.isActive.toString() as keyof typeof STATUS_COLORS]}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">How Eligibility Rules Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>• <strong>Priority:</strong> Higher priority rules are evaluated first. If a match is found, evaluation stops.</p>
          <p>• <strong>Attendance:</strong> If enabled, employees must be marked present to access the meal.</p>
          <p>• <strong>OT Requirement:</strong> For overtime meals, employees must have logged OT hours.</p>
          <p>• <strong>Time Windows:</strong> Optional specific time ranges within the meal session.</p>
          <p>• <strong>Applicable For:</strong> Rules can apply to specific shifts, departments, employee types, or individuals.</p>
        </CardContent>
      </Card>
    </div>
  )
}
