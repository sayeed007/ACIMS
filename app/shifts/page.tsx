'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Clock, Pencil, Archive, Loader2, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useShifts,
  useDeleteShift,
  useShiftStats,
  type Shift,
} from '@/hooks/useShifts';
import { ShiftFormDialog } from '@/components/shifts/shift-form-dialog';
import { useAuth } from '@/lib/providers/auth-provider';
import { toast } from 'sonner';

export default function ShiftsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [shiftToArchive, setShiftToArchive] = useState<string | null>(null);

  const { user, hasPermission } = useAuth();

  // Fetch shifts with search filter
  const { data, isLoading, error } = useShifts({
    search: searchQuery || undefined,
    limit: 50,
  });

  // Fetch shift statistics
  const { data: statsData, isLoading: statsLoading } = useShiftStats();

  // Delete mutation
  const deleteMutation = useDeleteShift();

  const shifts = data?.data || [];
  const stats = statsData || { total: 0, active: 0 };

  // Check permissions
  const canCreateShift =
    hasPermission('shift:create') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'HR_ADMIN';
  const canEditShift =
    hasPermission('shift:update') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'HR_ADMIN';
  const canDeleteShift =
    hasPermission('shift:delete') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'HR_ADMIN';

  // Handlers
  const handleCreateShift = () => {
    setDialogMode('create');
    setSelectedShift(null);
    setDialogOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setDialogMode('edit');
    setSelectedShift(shift);
    setDialogOpen(true);
  };

  const handleArchiveClick = (shiftId: string) => {
    setShiftToArchive(shiftId);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (shiftToArchive) {
      await deleteMutation.mutateAsync(shiftToArchive);
      setArchiveDialogOpen(false);
      setShiftToArchive(null);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/shifts/export?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shifts_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Shifts exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export shifts');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shifts</h1>
          <p className="text-muted-foreground">
            Configure and manage work shifts and meal eligibility
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateShift && (
            <Button onClick={handleCreateShift}>
              <Plus className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total registered shifts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.active}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}
              % of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search shifts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-900" />
                <p className="mt-4 text-sm text-muted-foreground">Loading shifts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading shifts</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No shifts found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new shift'}
              </p>
              {!searchQuery && canCreateShift && (
                <Button className="mt-4" onClick={handleCreateShift}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Shift
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Meal Eligibility</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift._id}>
                    <TableCell className="font-medium">{shift.code}</TableCell>
                    <TableCell>{shift.name}</TableCell>
                    <TableCell>
                      {shift.startTime} - {shift.endTime}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {shift?.mealEligibility?.breakfast && (
                          <Badge variant="outline" className="text-xs">
                            Breakfast
                          </Badge>
                        )}
                        {shift?.mealEligibility?.lunch && (
                          <Badge variant="outline" className="text-xs">
                            Lunch
                          </Badge>
                        )}
                        {shift?.mealEligibility?.dinner && (
                          <Badge variant="outline" className="text-xs">
                            Dinner
                          </Badge>
                        )}
                        {shift?.mealEligibility?.snacks && (
                          <Badge variant="outline" className="text-xs">
                            Snacks
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          shift.status === 'ACTIVE' ? 'default' : 'secondary'
                        }
                        className="capitalize"
                      >
                        {shift.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditShift && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditShift(shift)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteShift && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveClick(shift._id)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Archive shift"
                          >
                            <Archive className="h-4 w-4" />
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

      {/* Shift Form Dialog */}
      <ShiftFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        shift={selectedShift}
        mode={dialogMode}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the shift and mark it as inactive. The shift
              will be hidden from the active list but can be restored later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Archiving...
                </>
              ) : (
                'Archive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
