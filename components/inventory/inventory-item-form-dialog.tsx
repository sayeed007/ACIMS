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
import {
  useCreateInventoryItem,
  useUpdateInventoryItem,
  type InventoryItem,
  type CreateInventoryItemData,
} from '@/hooks/useInventoryItems';
import { Loader2 } from 'lucide-react';

interface InventoryItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem | null;
  mode: 'create' | 'edit';
}

const CATEGORIES = [
  'Grains',
  'Oils',
  'Vegetables',
  'Fruits',
  'Lentils',
  'Spices',
  'Dairy',
  'Meat',
  'Other',
];

const UNITS = ['KG', 'G', 'L', 'ML', 'PCS', 'BOX', 'BAG'];

export function InventoryItemFormDialog({
  open,
  onOpenChange,
  item,
  mode,
}: InventoryItemFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateInventoryItemData>({
    defaultValues: {
      itemCode: '',
      name: '',
      description: '',
      category: 'Grains',
      unit: 'KG',
      currentStock: 0,
      reorderLevel: 0,
      reorderQuantity: 0,
      avgCostPerUnit: 0,
      storageLocation: '',
      shelfLife: 0,
    },
  });

  const selectedCategory = watch('category');
  const selectedUnit = watch('unit');

  // Reset form when dialog opens/closes or item changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && item) {
        reset({
          itemCode: item.itemCode,
          name: item.name,
          description: item.description || '',
          category: item.category.name,
          unit: item.unit,
          currentStock: item.currentStock,
          reorderLevel: item.reorderLevel,
          reorderQuantity: item.reorderQuantity || 0,
          avgCostPerUnit: item.avgCostPerUnit,
          storageLocation: item.storageLocation || '',
          shelfLife: item.shelfLife || 0,
        });
      } else {
        reset({
          itemCode: '',
          name: '',
          description: '',
          category: 'Grains',
          unit: 'KG',
          currentStock: 0,
          reorderLevel: 0,
          reorderQuantity: 0,
          avgCostPerUnit: 0,
          storageLocation: '',
          shelfLife: 0,
        });
      }
    }
  }, [open, mode, item, reset]);

  const onSubmit = async (data: CreateInventoryItemData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (item) {
        await updateMutation.mutateAsync({
          id: item._id,
          data,
        });
      }
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
          <DialogTitle>
            {mode === 'create' ? 'Add New Inventory Item' : 'Edit Inventory Item'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new inventory item.'
              : 'Update the inventory item information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Item Code */}
            <div className="space-y-2">
              <Label htmlFor="itemCode">
                Item Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="itemCode"
                placeholder="RICE-001"
                {...register('itemCode', { required: 'Item code is required' })}
                disabled={mode === 'edit'}
              />
              {errors.itemCode && (
                <p className="text-sm text-red-600">{errors.itemCode.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Item Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Basmati Rice"
                {...register('name', { required: 'Item name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setValue('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <Label htmlFor="unit">
                Unit <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedUnit}
                onValueChange={(value) => setValue('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Stock */}
            <div className="space-y-2">
              <Label htmlFor="currentStock">
                Current Stock <span className="text-red-500">*</span>
              </Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                step="0.01"
                {...register('currentStock', {
                  required: 'Current stock is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.currentStock && (
                <p className="text-sm text-red-600">{errors.currentStock.message}</p>
              )}
            </div>

            {/* Reorder Level */}
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">
                Reorder Level <span className="text-red-500">*</span>
              </Label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                step="0.01"
                {...register('reorderLevel', {
                  required: 'Reorder level is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.reorderLevel && (
                <p className="text-sm text-red-600">{errors.reorderLevel.message}</p>
              )}
            </div>

            {/* Reorder Quantity */}
            <div className="space-y-2">
              <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
              <Input
                id="reorderQuantity"
                type="number"
                min="0"
                step="0.01"
                {...register('reorderQuantity', { valueAsNumber: true })}
              />
            </div>

            {/* Average Cost Per Unit */}
            <div className="space-y-2">
              <Label htmlFor="avgCostPerUnit">
                Cost Per Unit (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="avgCostPerUnit"
                type="number"
                min="0"
                step="0.01"
                {...register('avgCostPerUnit', {
                  required: 'Cost per unit is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Must be positive' },
                })}
              />
              {errors.avgCostPerUnit && (
                <p className="text-sm text-red-600">{errors.avgCostPerUnit.message}</p>
              )}
            </div>

            {/* Storage Location */}
            <div className="space-y-2">
              <Label htmlFor="storageLocation">Storage Location</Label>
              <Input
                id="storageLocation"
                placeholder="Warehouse A - Shelf 5"
                {...register('storageLocation')}
              />
            </div>

            {/* Shelf Life */}
            <div className="space-y-2">
              <Label htmlFor="shelfLife">Shelf Life (days)</Label>
              <Input
                id="shelfLife"
                type="number"
                min="0"
                {...register('shelfLife', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the item..."
              rows={3}
              {...register('description')}
            />
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Item' : 'Update Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
