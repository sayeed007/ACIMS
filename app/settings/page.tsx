'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Shield, Loader2, Lock } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAccessControlRoles } from '@/hooks/useAccessControlRoles'

const STATUS_COLORS = {
  true: 'bg-green-100 text-green-800',
  false: 'bg-slate-100 text-slate-800',
}

export default function SettingsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading } = useAccessControlRoles({
    search: searchQuery || undefined,
    limit: 100,
  })

  const roles = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Access Control & Roles</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
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
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No roles found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create a new role to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role: any) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.isSystemRole && <Lock className="h-4 w-4 text-amber-600" />}
                        {role.roleName}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{role.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{role.permissions?.length || 0} permissions</Badge>
                    </TableCell>
                    <TableCell>
                      {role.isSystemRole ? (
                        <Badge className="bg-amber-100 text-amber-800">System</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[role.isActive.toString() as keyof typeof STATUS_COLORS]}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-100">Permission System</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>• <strong>System Roles:</strong> Cannot be deleted or modified (e.g., Super Admin, Admin).</p>
          <p>• <strong>Custom Roles:</strong> Created by admins with specific permission sets.</p>
          <p>• <strong>Module Access:</strong> Controls which modules users can see in navigation.</p>
          <p>• <strong>Data Scope:</strong> Limits data visibility (ALL, DEPARTMENT, OWN).</p>
          <p>• <strong>Permissions:</strong> Granular control over view, create, update, delete, approve actions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
