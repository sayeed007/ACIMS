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
import { useCreateStockMovement, useUpdateStockMovement, type CreateStockMovementData, type StockMovement } from '@/hooks/useStockMovements';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { Loader2 } from 'lucide-react';

interface StockMovementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movement?: StockMovement | null;
  mode?: 'create' | 'edit';
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
  movement,
  mode = 'create',
  preselectedItemId,
}: StockMovementFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateStockMovement();
  const updateMutation = useUpdateStockMovement();

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
    mode: 'onChange', // Enable validation on change
  });

  const selectedItemId = watch('itemId');
  const selectedMovementType = watch('movementType');
  const selectedReferenceType = watch('referenceType');

  // Find selected item details
  const selectedItem = items.find((item: any) => item._id === selectedItemId);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && movement) {
        // Populate form with movement data for edit mode
        reset({
          itemId: movement.item.id,
          movementType: movement.movementType,
          quantity: movement.quantity,
          fromLocation: movement.fromLocation || '',
          toLocation: movement.toLocation || '',
          referenceType: movement.referenceType || 'MANUAL',
          referenceNumber: movement.referenceNumber || '',
          costPerUnit: movement.costPerUnit || 0,
          reason: movement.reason || '',
          notes: movement.notes || '',
          transactionDate: movement.transactionDate ? new Date(movement.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        });
      } else {
        // Reset to defaults for create mode
        reset({
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
        });
      }
    }
  }, [open, mode, movement, preselectedItemId, reset]);

  // Update cost per unit when item changes
  useEffect(() => {
    if (selectedItem && selectedItem.avgCostPerUnit) {
      setValue('costPerUnit', selectedItem.avgCostPerUnit);
    }
  }, [selectedItem, setValue]);

  const onSubmit = async (data: CreateStockMovementData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'edit' && movement) {
        // For PENDING movements, allow updating all fields
        // For COMPLETED movements, only allow updating notes
        if (movement.status === 'PENDING') {
          await updateMutation.mutateAsync({
            id: movement._id,
            data: {
              itemId: data.itemId,
              movementType: data.movementType,
              quantity: data.quantity,
              fromLocation: data.fromLocation,
              toLocation: data.toLocation,
              referenceType: data.referenceType,
              referenceNumber: data.referenceNumber,
              costPerUnit: data.costPerUnit,
              reason: data.reason,
              notes: data.notes,
              transactionDate: data.transactionDate,
            },
          });
        } else {
          // For COMPLETED movements, only update notes
          await updateMutation.mutateAsync({
            id: movement._id,
            data: {
              notes: data.notes,
            },
          });
        }
      } else {
        // Create new movement (referenceNumber will be auto-generated by backend)
        const { referenceNumber, ...createData } = data;
        await createMutation.mutateAsync(createData);
      }
      onOpenChange(false);
      reset();
    } catch (error: any) {
      console.error('Form submission error:', error);
      // Error is already shown via toast from the mutation hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Stock Movement' : 'Record Stock Movement'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? movement?.status === 'COMPLETED'
                ? 'Movement is completed. Only notes can be updated.'
                : 'Update movement details before completing it.'
              : 'Record incoming, outgoing, or adjustment of inventory stock.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Item Selection */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="itemId">
                Inventory Item <span className="text-red-500">*</span>
              </Label>
              {/* Hidden input to register the field with react-hook-form */}
              <input
                type="hidden"
                {...register('itemId', { required: 'Please select an inventory item' })}
              />
              <Select
                value={selectedItemId && selectedItemId !== '' ? selectedItemId : undefined}
                onValueChange={(value) => {
                  setValue('itemId', value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                }}
                disabled={!!preselectedItemId || (mode === 'edit' && movement?.status === 'COMPLETED')}
              >
                <SelectTrigger className={errors.itemId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select inventory item">
                    {selectedItem ? `${selectedItem.itemCode} - ${selectedItem.name}` : 'Select inventory item'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {items.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No items available
                    </div>
                  ) : (
                    items.map((item: any) => (
                      <SelectItem key={item._id} value={item._id}>
                        {item.itemCode} - {item.name} (Stock: {item.currentStock} {item.unit})
                      </SelectItem>
                    ))
                  )}
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
              <input
                type="hidden"
                {...register('movementType', { required: true })}
              />
              <Select
                value={selectedMovementType || undefined}
                onValueChange={(value: any) => setValue('movementType', value, { shouldValidate: true })}
                disabled={mode === 'edit' && movement?.status === 'COMPLETED'}
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
                min="0.01"
                disabled={mode === 'edit' && movement?.status === 'COMPLETED'}
                {...register('quantity', {
                  required: 'Quantity is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Quantity must be greater than 0' },
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
              <input
                type="hidden"
                {...register('referenceType')}
              />
              <Select
                value={selectedReferenceType || undefined}
                onValueChange={(value: any) => setValue('referenceType', value, { shouldValidate: true })}
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
                placeholder="Auto-generated by system"
                disabled
                className="bg-muted"
                value={mode === 'edit' ? movement?.referenceNumber : ''}
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                ℹ️ Reference number will be automatically generated by the system
              </p>
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
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update Movement' : 'Record Movement'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
