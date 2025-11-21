'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Hash, Edit2, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  useNumberSequences,
  useInitializeSequences,
  useUpdateSequence,
  useResetSequence,
  type NumberSequence,
} from '@/hooks/useNumberSequences'

const ENTITY_LABELS: Record<string, string> = {
  BILL: 'Bills',
  DEMAND: 'Purchase Demands',
  PURCHASE_ORDER: 'Purchase Orders',
  STOCK_MOVEMENT: 'Stock Movements',
  EMPLOYEE: 'Employees',
  VENDOR: 'Vendors',
}

export default function NumberSequencesPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [selectedSequence, setSelectedSequence] = useState<NumberSequence | null>(null)
  const [editForm, setEditForm] = useState({ prefix: '', length: 6, description: '' })
  const [resetValue, setResetValue] = useState(0)

  const { data, isLoading } = useNumberSequences()
  const initializeMutation = useInitializeSequences()
  const updateMutation = useUpdateSequence()
  const resetMutation = useResetSequence()

  const sequences = (data?.data || []) as NumberSequence[]

  const handleEdit = (sequence: NumberSequence) => {
    setSelectedSequence(sequence)
    setEditForm({
      prefix: sequence.prefix,
      length: sequence.length,
      description: sequence.description || '',
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedSequence) return

    await updateMutation.mutateAsync({
      entityType: selectedSequence.entityType,
      data: editForm,
    })
    setEditDialogOpen(false)
  }

  const handleResetClick = (sequence: NumberSequence) => {
    setSelectedSequence(sequence)
    setResetValue(0)
    setResetDialogOpen(true)
  }

  const handleResetConfirm = async () => {
    if (!selectedSequence) return

    await resetMutation.mutateAsync({
      entityType: selectedSequence.entityType,
      resetTo: resetValue,
    })
    setResetDialogOpen(false)
  }

  const handleInitialize = async () => {
    await initializeMutation.mutateAsync()
  }

  const formatExample = (sequence: NumberSequence) => {
    const nextNumber = (sequence.currentNumber + 1).toString().padStart(sequence.length, '0')
    return sequence.format.replace('{PREFIX}', sequence.prefix).replace('{NUMBER}', nextNumber)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Number Sequences</h1>
          <p className="text-muted-foreground">Configure auto-generation settings for unique identifiers</p>
        </div>
        {sequences.length === 0 && !isLoading && (
          <Button onClick={handleInitialize} disabled={initializeMutation.isPending}>
            {initializeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Hash className="mr-2 h-4 w-4" />
            Initialize Sequences
          </Button>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            About Auto-Number Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p>• <strong>Auto-Generation:</strong> All forms will auto-generate unique numbers when left empty.</p>
          <p>• <strong>Prefix:</strong> Customize the prefix for each entity type (e.g., BILL, PO, VEN).</p>
          <p>• <strong>Length:</strong> Set how many digits the number should have (3-10 digits).</p>
          <p>• <strong>Format:</strong> Numbers follow the pattern: PREFIX-NUMBER (e.g., BILL-000001).</p>
          <p>• <strong>Reset:</strong> Use with caution - resetting can cause duplicate number issues if records exist.</p>
        </CardContent>
      </Card>

      {/* Sequences Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Sequences</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            </div>
          ) : sequences.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Hash className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">No Sequences Configured</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Initialize default sequences to enable auto-number generation
              </p>
              <Button onClick={handleInitialize} className="mt-4" disabled={initializeMutation.isPending}>
                {initializeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Initialize Now
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Prefix</TableHead>
                  <TableHead>Length</TableHead>
                  <TableHead>Current Number</TableHead>
                  <TableHead>Next Example</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences.map((sequence) => (
                  <TableRow key={sequence._id}>
                    <TableCell className="font-medium">
                      {ENTITY_LABELS[sequence.entityType]}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {sequence.prefix}
                      </Badge>
                    </TableCell>
                    <TableCell>{sequence.length} digits</TableCell>
                    <TableCell className="font-mono">{sequence.currentNumber}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-sm">
                        {formatExample(sequence)}
                      </code>
                    </TableCell>
                    <TableCell>
                      {sequence.isActive ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(sequence)}
                          title="Edit sequence"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetClick(sequence)}
                          title="Reset counter"
                          className="text-amber-600 hover:text-amber-700"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sequence Configuration</DialogTitle>
            <DialogDescription>
              Update the prefix and length for {selectedSequence && ENTITY_LABELS[selectedSequence.entityType]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={editForm.prefix}
                onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })}
                placeholder="e.g., BILL"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Number Length (3-10 digits)</Label>
              <Input
                id="length"
                type="number"
                min={3}
                max={10}
                value={editForm.length}
                onChange={(e) => setEditForm({ ...editForm, length: parseInt(e.target.value) || 6 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="e.g., Bill Number Sequence"
              />
            </div>
            <div className="p-3 bg-muted rounded">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <code className="text-sm">
                {editForm.prefix}-{(selectedSequence?.currentNumber || 0).toString().padStart(editForm.length, '0')}
              </code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Sequence Counter</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to reset the counter for{' '}
                <strong>{selectedSequence && ENTITY_LABELS[selectedSequence.entityType]}</strong>.
              </p>
              <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded mt-2">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Warning:</strong> Resetting can cause duplicate numbers if records already exist.
                  Only reset if you're sure no conflicts will occur.
                </p>
              </div>
              <div className="mt-4">
                <Label htmlFor="resetValue">Reset counter to:</Label>
                <Input
                  id="resetValue"
                  type="number"
                  min={0}
                  value={resetValue}
                  onChange={(e) => setResetValue(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reset Counter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
