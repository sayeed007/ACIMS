'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateReconciliation, type CreateReconciliationData } from '@/hooks/useReconciliations'
import { useInventoryItems } from '@/hooks/useInventoryItems'
import { Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface ReconciliationFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedItemId?: string
}

export function ReconciliationFormDialog({
  open,
  onOpenChange,
  preselectedItemId,
}: ReconciliationFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoAdjust, setAutoAdjust] = useState(false)

  const createMutation = useCreateReconciliation()

  // Fetch inventory items for dropdown
  const { data: itemsData } = useInventoryItems({ limit: 100 })
  const items = itemsData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateReconciliationData>({
    defaultValues: {
      itemId: preselectedItemId || '',
      physicalStock: 0,
      reconciliationDate: new Date().toISOString().split('T')[0],
      location: '',
      reason: '',
      notes: '',
      status: 'DRAFT',
      autoAdjust: false,
    },
  })

  const selectedItemId = watch('itemId')
  const physicalStock = watch('physicalStock')

  // Find selected item details
  const selectedItem = items.find((item: any) => item._id === selectedItemId)

  // Calculate discrepancy
  const systemStock = selectedItem?.currentStock || 0
  const discrepancy = physicalStock - systemStock
  const discrepancyPercentage =
    systemStock > 0 ? ((discrepancy / systemStock) * 100).toFixed(2) : physicalStock > 0 ? '100' : '0'

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        itemId: preselectedItemId || '',
        physicalStock: 0,
        reconciliationDate: new Date().toISOString().split('T')[0],
        location: '',
        reason: '',
        notes: '',
        status: 'DRAFT',
        autoAdjust: false,
      })
      setAutoAdjust(false)
    }
  }, [open, preselectedItemId, reset])

  const onSubmit = async (data: CreateReconciliationData) => {
    setIsSubmitting(true)
    try {
      await createMutation.mutateAsync({
        ...data,
        autoAdjust,
      })
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Reconciliation</DialogTitle>
          <DialogDescription>
            Compare physical stock count with system stock and record discrepancies.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Item Selection */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="itemId">
                Inventory Item <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedItemId}
                onValueChange={(value) => setValue('itemId', value)}
                disabled={!!preselectedItemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select inventory item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item: any) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.itemCode} - {item.name} (Current: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && (
                <p className="text-sm text-red-600">{errors.itemId.message}</p>
              )}
            </div>

            {/* Physical Stock */}
            <div className="space-y-2">
              <Label htmlFor="physicalStock">
                Physical Stock Count {selectedItem && `(${selectedItem.unit})`}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="physicalStock"
                type="number"
                step="0.01"
                {...register('physicalStock', {
                  required: 'Physical stock is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Physical stock cannot be negative' },
                })}
              />
              {errors.physicalStock && (
                <p className="text-sm text-red-600">{errors.physicalStock.message}</p>
              )}
            </div>

            {/* Reconciliation Date */}
            <div className="space-y-2">
              <Label htmlFor="reconciliationDate">Reconciliation Date</Label>
              <Input
                id="reconciliationDate"
                type="date"
                {...register('reconciliationDate')}
              />
            </div>

            {/* Location */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Main Warehouse, Storage Room A"
                {...register('location')}
              />
            </div>

            {/* Reason */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Monthly physical count, Spot check"
                {...register('reason')}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about the reconciliation..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Discrepancy Info */}
          {selectedItem && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">System Stock:</span>
                  <span className="font-medium">
                    {systemStock} {selectedItem.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Physical Stock:</span>
                  <span className="font-medium">
                    {physicalStock || 0} {selectedItem.unit}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Discrepancy:</span>
                  <div className="flex items-center gap-2">
                    {discrepancy !== 0 && (
                      <>
                        {discrepancy > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                      </>
                    )}
                    <span
                      className={`font-semibold ${
                        discrepancy > 0
                          ? 'text-green-600'
                          : discrepancy < 0
                          ? 'text-red-600'
                          : 'text-slate-600'
                      }`}
                    >
                      {discrepancy > 0 ? '+' : ''}
                      {discrepancy} {selectedItem.unit} ({discrepancyPercentage}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Auto Adjust Option */}
              {discrepancy !== 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="autoAdjust"
                      checked={autoAdjust}
                      onCheckedChange={(checked) => setAutoAdjust(checked as boolean)}
                    />
                    <div className="space-y-1 leading-none">
                      <Label
                        htmlFor="autoAdjust"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Auto-adjust stock level
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create an adjustment stock movement and update the
                        inventory to match physical count
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {discrepancy !== 0 && Math.abs(parseFloat(discrepancyPercentage)) > 10 && (
                <div className="mt-4 flex items-start gap-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-xs text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">High Discrepancy Warning</p>
                    <p>
                      The discrepancy exceeds 10%. Please verify the physical count and
                      consider adding a detailed reason.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={watch('status')} onValueChange={(value: any) => setValue('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Save as Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submit for Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !selectedItem}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {autoAdjust && watch('status') === 'SUBMITTED' ? 'Submit & Adjust' : 'Save Reconciliation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
