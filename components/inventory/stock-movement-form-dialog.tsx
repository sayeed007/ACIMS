'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateStockMovement, type CreateStockMovementData } from '@/hooks/useStockMovements';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { Loader2 } from 'lucide-react';

interface StockMovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedItemId?: string;
}

const MOVEMENT_TYPES = [
  { value: 'IN', label: 'Stock In', description: 'Receive new stock' },
  { value: 'OUT', label: 'Stock Out', description: 'Issue/consumption' },
  { value: 'ADJUSTMENT', label: 'Adjustment', description: 'Stock correction' },
  { value: 'TRANSFER', label: 'Transfer', description: 'Move between locations' },
  { value: 'RETURN', label: 'Return', description: 'Return to stock' },
];

const REFERENCE_TYPES = [
  { value: 'MANUAL', label: 'Manual Entry' },
  { value: 'PURCHASE_ORDER', label: 'Purchase Order' },
  { value: 'CONSUMPTION', label: 'Consumption' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'RETURN', label: 'Return' },
  { value: 'RECONCILIATION', label: 'Reconciliation' },
];

export function StockMovementFormDialog({
  open,
  onOpenChange,
  preselectedItemId,
}: StockMovementFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateStockMovement();

  // Fetch inventory items for dropdown
  const { data: itemsData } = useInventoryItems({ limit: 100 });
  const items = itemsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateStockMovementData>({
    defaultValues: {
      itemId: preselectedItemId || '',
      movementType: 'IN',
      quantity: 0,
      fromLocation: '',
      toLocation: '',
      referenceType: 'MANUAL',
      referenceNumber: '',
      costPerUnit: 0,
      reason: '',
      notes: '',
      transactionDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedItemId = watch('itemId');
  const selectedMovementType = watch('movementType');
  const selectedReferenceType = watch('referenceType');

  // Find selected item details
  const selectedItem = items.find((item: any) => item._id === selectedItemId);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      reset({
        itemId: preselectedItemId || '',
        movementType: 'IN',
        quantity: 0,
        fromLocation: '',
        toLocation: '',
        referenceType: 'MANUAL',
        referenceNumber: '',
        costPerUnit: selectedItem?.avgCostPerUnit || 0,
        reason: '',
        notes: '',
        transactionDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [open, preselectedItemId, reset, selectedItem]);

  // Update cost per unit when item changes
  useEffect(() => {
    if (selectedItem && selectedItem.avgCostPerUnit) {
      setValue('costPerUnit', selectedItem.avgCostPerUnit);
    }
  }, [selectedItem, setValue]);

  const onSubmit = async (data: CreateStockMovementData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Stock Movement</DialogTitle>
          <DialogDescription>
            Record incoming, outgoing, or adjustment of inventory stock.
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
                      {item.itemCode} - {item.name} (Stock: {item.currentStock} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.itemId && (
                <p className="text-sm text-red-600">{errors.itemId.message}</p>
              )}
            </div>

            {/* Movement Type */}
            <div className="space-y-2">
              <Label htmlFor="movementType">
                Movement Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedMovementType}
                onValueChange={(value: any) => setValue('movementType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity {selectedItem && `(${selectedItem.unit})`} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', {
                  required: 'Quantity is required',
                  valueAsNumber: true,
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            {/* From Location (for OUT/TRANSFER) */}
            {(selectedMovementType === 'OUT' || selectedMovementType === 'TRANSFER') && (
              <div className="space-y-2">
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  placeholder="e.g., Main Warehouse"
                  {...register('fromLocation')}
                />
              </div>
            )}

            {/* To Location (for IN/TRANSFER) */}
            {(selectedMovementType === 'IN' || selectedMovementType === 'TRANSFER') && (
              <div className="space-y-2">
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  placeholder="e.g., Storage Room A"
                  {...register('toLocation')}
                />
              </div>
            )}

            {/* Cost Per Unit (for IN movements) */}
            {(selectedMovementType === 'IN' || selectedMovementType === 'RETURN') && (
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">Cost Per Unit (₹)</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  {...register('costPerUnit', { valueAsNumber: true })}
                />
              </div>
            )}

            {/* Reference Type */}
            <div className="space-y-2">
              <Label htmlFor="referenceType">Reference Type</Label>
              <Select
                value={selectedReferenceType}
                onValueChange={(value: any) => setValue('referenceType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  {REFERENCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                placeholder="e.g., PO-2024-001"
                {...register('referenceNumber')}
              />
            </div>

            {/* Transaction Date */}
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date</Label>
              <Input
                id="transactionDate"
                type="date"
                {...register('transactionDate')}
              />
            </div>

            {/* Reason (for ADJUSTMENT) */}
            {selectedMovementType === 'ADJUSTMENT' && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Adjustment</Label>
                <Input
                  id="reason"
                  placeholder="e.g., Stock count correction"
                  {...register('reason')}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional details about this movement..."
              rows={3}
              {...register('notes')}
            />
          </div>

          {/* Current Stock Info */}
          {selectedItem && (
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-medium">{selectedItem.currentStock} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reorder Level:</span>
                  <span className="font-medium">{selectedItem.reorderLevel} {selectedItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Cost/Unit:</span>
                  <span className="font-medium">₹{selectedItem.avgCostPerUnit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
