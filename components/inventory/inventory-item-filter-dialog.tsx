'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter } from 'lucide-react';

export interface InventoryItemFilters {
  category?: string;
  status?: string;
  lowStock?: boolean;
}

interface InventoryItemFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: InventoryItemFilters;
  onFiltersChange: (filters: InventoryItemFilters) => void;
}

export function InventoryItemFilterDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: InventoryItemFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<InventoryItemFilters>(filters);

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: InventoryItemFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleClearSingleFilter = (key: keyof InventoryItemFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(
      (key) => localFilters[key as keyof InventoryItemFilters] !== undefined
    ).length;
  };

  const getFilterLabel = (key: keyof InventoryItemFilters, value: any) => {
    switch (key) {
      case 'category':
        return `Category: ${value}`;
      case 'status':
        return `Status: ${value}`;
      case 'lowStock':
        return 'Low Stock Only';
      default:
        return value;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Inventory Items
          </SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your inventory search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Active Filters */}
          {getActiveFiltersCount() > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(localFilters).map(
                  ([key, value]) =>
                    value !== undefined && (
                      <Badge key={key} variant="secondary" className="gap-1">
                        {getFilterLabel(key as keyof InventoryItemFilters, value)}
                        <button
                          onClick={() =>
                            handleClearSingleFilter(key as keyof InventoryItemFilters)
                          }
                          className="ml-1 hover:bg-slate-200 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                )}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="Enter category name (e.g., Grains, Oils, Dairy)"
              value={localFilters.category || ''}
              onChange={(e) =>
                setLocalFilters({
                  ...localFilters,
                  category: e.target.value || undefined,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Filter by category name (case-insensitive)
            </p>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={localFilters.status || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  status: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Low Stock Filter */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowStock"
                checked={localFilters.lowStock || false}
                onCheckedChange={(checked) =>
                  setLocalFilters({
                    ...localFilters,
                    lowStock: checked === true ? true : undefined,
                  })
                }
              />
              <Label
                htmlFor="lowStock"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Show only low stock items
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Items where current stock is less than or equal to reorder level
            </p>
          </div>
        </div>

        <SheetFooter className="gap-2">
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All
          </Button>
          <Button onClick={handleApplyFilters}>
            Apply Filters
            {getActiveFiltersCount() > 0 && (
              <Badge className="ml-2 bg-white text-primary hover:bg-white">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
