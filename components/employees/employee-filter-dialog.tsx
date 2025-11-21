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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { useDepartments } from '@/hooks/useDepartments';
import { useShifts } from '@/hooks/useShifts';

export interface EmployeeFilters {
  departmentId?: string;
  shiftId?: string;
  employmentType?: string;
  status?: string;
}

interface EmployeeFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EmployeeFilters;
  onFiltersChange: (filters: EmployeeFilters) => void;
}

export function EmployeeFilterDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
}: EmployeeFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<EmployeeFilters>(filters);

  // Fetch departments and shifts for filter options
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: shiftsData } = useShifts({ limit: 100 });

  const departments = departmentsData?.data || [];
  const shifts = shiftsData?.data || [];

  // Update local filters when prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    const emptyFilters: EmployeeFilters = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const handleClearSingleFilter = (key: keyof EmployeeFilters) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];
    setLocalFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.keys(localFilters).filter(
      (key) => localFilters[key as keyof EmployeeFilters]
    ).length;
  };

  const getFilterLabel = (key: keyof EmployeeFilters, value: string) => {
    switch (key) {
      case 'departmentId':
        const dept = departments.find((d) => d._id === value);
        return dept ? `Dept: ${dept.name}` : 'Department';
      case 'shiftId':
        const shift = shifts.find((s) => s._id === value);
        return shift ? `Shift: ${shift.name}` : 'Shift';
      case 'employmentType':
        return `Type: ${value.replace('_', ' ')}`;
      case 'status':
        return `Status: ${value}`;
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
            Filter Employees
          </SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your employee search
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
                    value && (
                      <Badge key={key} variant="secondary" className="gap-1">
                        {getFilterLabel(key as keyof EmployeeFilters, value)}
                        <button
                          onClick={() =>
                            handleClearSingleFilter(key as keyof EmployeeFilters)
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

          {/* Department Filter */}
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={localFilters.departmentId || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  departmentId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Filter */}
          <div className="space-y-2">
            <Label htmlFor="shift">Shift</Label>
            <Select
              value={localFilters.shiftId || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  shiftId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="shift">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shifts.map((shift) => (
                  <SelectItem key={shift._id} value={shift._id}>
                    {shift.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select
              value={localFilters.employmentType || 'all'}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  employmentType: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger id="employmentType">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PERMANENT">Permanent</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="TEMPORARY">Temporary</SelectItem>
                <SelectItem value="VENDOR">Vendor</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>
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
