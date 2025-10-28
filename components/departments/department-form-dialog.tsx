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
  useCreateDepartment,
  useUpdateDepartment,
  type Department,
  type CreateDepartmentData,
} from '@/hooks/useDepartments';
import { Loader2 } from 'lucide-react';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  mode: 'create' | 'edit';
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  mode,
}: DepartmentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDepartmentData>({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      costCenter: '',
      location: '',
    },
  });

  // Reset form when dialog opens/closes or department changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && department) {
        reset({
          name: department.name,
          code: department.code,
          description: department.description || '',
          costCenter: department.costCenter || '',
          location: department.location || '',
        });
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          costCenter: '',
          location: '',
        });
      }
    }
  }, [open, mode, department, reset]);

  const onSubmit = async (data: CreateDepartmentData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (department) {
        await updateMutation.mutateAsync({
          id: department._id,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Department' : 'Edit Department'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new department.'
              : 'Update the department information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Department Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Engineering"
                {...register('name', { required: 'Department name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Department Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Department Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="ENG"
                {...register('code', { required: 'Department code is required' })}
                disabled={mode === 'edit'}
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            {/* Cost Center */}
            <div className="space-y-2">
              <Label htmlFor="costCenter">Cost Center</Label>
              <Input
                id="costCenter"
                placeholder="CC-001"
                {...register('costCenter')}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="Building A, Floor 3"
                {...register('location')}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the department..."
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
              {mode === 'create' ? 'Create Department' : 'Update Department'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
