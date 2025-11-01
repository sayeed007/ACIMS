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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEmployee, useUpdateEmployee, type Employee, type CreateEmployeeData } from '@/hooks/useEmployees';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Loader2 } from 'lucide-react';

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  mode: 'create' | 'edit';
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  mode,
}: EmployeeFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  // Fetch departments and shifts for dropdowns
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.getDepartments(),
  });

  const { data: shiftsData } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => api.getShifts(),
  });

  const departments = departmentsData?.data || [];
  const shifts = shiftsData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEmployeeData>({
    defaultValues: {
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      departmentId: '',
      shiftId: '',
      employmentType: 'PERMANENT',
      dateOfJoining: new Date().toISOString().split('T')[0],
    },
  });

  const selectedDepartmentId = watch('departmentId');
  const selectedShiftId = watch('shiftId');
  const selectedEmployeeType = watch('employmentType');

  // Reset form when dialog opens/closes or employee changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && employee) {
        reset({
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email || '',
          phone: employee.phone || '',
          departmentId: employee.department.id as any,
          shiftId: employee.shift.id as any,
          employmentType: employee.employmentType,
          dateOfJoining: employee.joiningDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        });
      } else {
        reset({
          employeeId: '',
          name: '',
          email: '',
          phone: '',
          departmentId: '',
          shiftId: '',
          employmentType: 'PERMANENT',
          dateOfJoining: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [open, mode, employee, reset]);

  const onSubmit = async (data: CreateEmployeeData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (employee) {
        await updateMutation.mutateAsync({
          id: employee._id,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Employee' : 'Edit Employee'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new employee record.'
              : 'Update the employee information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Employee ID */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">
                Employee ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="employeeId"
                placeholder="EMP001"
                {...register('employeeId', { required: 'Employee ID is required' })}
                disabled={mode === 'edit'}
              />
              {errors.employeeId && (
                <p className="text-sm text-red-600">{errors.employeeId.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                {...register('phone')}
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="departmentId">
                Department <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedDepartmentId}
                onValueChange={(value) => setValue('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && (
                <p className="text-sm text-red-600">{errors.departmentId.message}</p>
              )}
            </div>

            {/* Shift */}
            <div className="space-y-2">
              <Label htmlFor="shiftId">
                Shift <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedShiftId}
                onValueChange={(value) => setValue('shiftId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift: any) => (
                    <SelectItem key={shift._id} value={shift._id}>
                      {shift.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.shiftId && (
                <p className="text-sm text-red-600">{errors.shiftId.message}</p>
              )}
            </div>

            {/* Employee Type */}
            <div className="space-y-2">
              <Label htmlFor="employeeType">
                Employee Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedEmployeeType}
                onValueChange={(value: any) => setValue('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERMANENT">Permanent</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="TEMPORARY">Temporary</SelectItem>
                  <SelectItem value="VENDOR_STAFF">Vendor Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Joining */}
            <div className="space-y-2">
              <Label htmlFor="dateOfJoining">
                Date of Joining <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfJoining"
                type="date"
                {...register('dateOfJoining', { required: 'Date of joining is required' })}
              />
              {errors.dateOfJoining && (
                <p className="text-sm text-red-600">{errors.dateOfJoining.message}</p>
              )}
            </div>

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
              {mode === 'create' ? 'Create Employee' : 'Update Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
