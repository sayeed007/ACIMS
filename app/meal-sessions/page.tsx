'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Utensils, Pencil, Archive, Loader2, Download } from 'lucide-react';
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
  useMealSessions,
  useDeleteMealSession,
  useMealSessionStats,
  type MealSession,
} from '@/hooks/useMealSessions';
import { MealSessionFormDialog } from '@/components/meal-sessions/meal-session-form-dialog';
import { useAuth } from '@/lib/providers/auth-provider';
import { toast } from 'sonner';

export default function MealSessionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedSession, setSelectedSession] = useState<MealSession | null>(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [sessionToArchive, setSessionToArchive] = useState<string | null>(null);

  const { user, hasPermission } = useAuth();

  // Fetch meal sessions with search filter
  const { data, isLoading, error } = useMealSessions({
    search: searchQuery || undefined,
    limit: 50,
  });

  // Fetch meal session statistics
  const { data: statsData, isLoading: statsLoading } = useMealSessionStats();

  // Delete mutation
  const deleteMutation = useDeleteMealSession();

  const sessions = data?.data || [];
  const stats = statsData || { total: 0, active: 0 };

  // Check permissions
  const canCreateSession =
    hasPermission('meal:create') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'CANTEEN_MANAGER';
  const canEditSession =
    hasPermission('meal:update') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'CANTEEN_MANAGER';
  const canDeleteSession =
    hasPermission('meal:delete') ||
    user?.role === 'ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'CANTEEN_MANAGER';

  // Handlers
  const handleCreateSession = () => {
    setDialogMode('create');
    setSelectedSession(null);
    setDialogOpen(true);
  };

  const handleEditSession = (session: MealSession) => {
    setDialogMode('edit');
    setSelectedSession(session);
    setDialogOpen(true);
  };

  const handleArchiveClick = (sessionId: string) => {
    setSessionToArchive(sessionId);
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (sessionToArchive) {
      await deleteMutation.mutateAsync(sessionToArchive);
      setArchiveDialogOpen(false);
      setSessionToArchive(null);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/meals/sessions/export?${queryParams.toString()}`, {
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
      a.download = `meal_sessions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Meal sessions exported successfully!');
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export meal sessions');
    }
  };

  const getMealTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'BREAKFAST':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LUNCH':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DINNER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SNACKS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'OVERTIME_MEAL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Sessions</h1>
          <p className="text-muted-foreground">
            Configure daily meal sessions and timings
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateSession && (
            <Button onClick={handleCreateSession}>
              <Plus className="mr-2 h-4 w-4" />
              Add Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse bg-slate-200 rounded"></div>
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total meal sessions configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Utensils className="h-4 w-4 text-green-600" />
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
                placeholder="Search meal sessions..."
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
                <p className="mt-4 text-sm text-muted-foreground">
                  Loading meal sessions...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-900">Error loading meal sessions</p>
              <p className="text-sm text-red-700">{(error as Error).message}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Utensils className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No meal sessions found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating a new meal session'}
              </p>
              {!searchQuery && canCreateSession && (
                <Button className="mt-4" onClick={handleCreateSession}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Session
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Meal Type</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell className="font-medium">{session.code}</TableCell>
                    <TableCell>{session.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getMealTypeBadgeColor(session.mealType)}
                      >
                        {session?.mealType?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {session.startTime} - {session.endTime}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={session.isActive ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {session.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEditSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSession(session)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDeleteSession && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArchiveClick(session._id)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            title="Archive meal session"
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

      {/* Meal Session Form Dialog */}
      <MealSessionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mealSession={selectedSession}
        mode={dialogMode}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Meal Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the meal session and mark it as inactive. The session
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
