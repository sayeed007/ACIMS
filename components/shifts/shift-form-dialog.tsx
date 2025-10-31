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
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateShift,
  useUpdateShift,
  type Shift,
  type CreateShiftData,
} from '@/hooks/useShifts';
import { Loader2 } from 'lucide-react';

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  mode: 'create' | 'edit';
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  shift,
  mode,
}: ShiftFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealEligibility, setMealEligibility] = useState({
    breakfast: true,
    lunch: true,
    dinner: false,
    snacks: false,
  });

  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateShiftData>({
    defaultValues: {
      name: '',
      code: '',
      description: '',
      startTime: '09:00',
      endTime: '18:00',
      gracePeriod: {
        entry: 15,
        exit: 15,
      },
    },
  });

  // Reset form when dialog opens/closes or shift changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && shift) {
        reset({
          name: shift.name,
          code: shift.code,
          description: shift.description || '',
          startTime: shift.startTime,
          endTime: shift.endTime,
          gracePeriod: shift.gracePeriod || { entry: 15, exit: 15 },
        });
        setMealEligibility(shift?.mealEligibility);
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          startTime: '09:00',
          endTime: '18:00',
          gracePeriod: {
            entry: 15,
            exit: 15,
          },
        });
        setMealEligibility({
          breakfast: true,
          lunch: true,
          dinner: false,
          snacks: false,
        });
      }
    }
  }, [open, mode, shift, reset]);

  const onSubmit = async (data: CreateShiftData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        mealEligibility,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
      } else if (shift) {
        await updateMutation.mutateAsync({
          id: shift._id,
          data: submitData,
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
            {mode === 'create' ? 'Add New Shift' : 'Edit Shift'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new shift.'
              : 'Update the shift information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Shift Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Shift Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Morning Shift"
                {...register('name', { required: 'Shift name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Shift Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Shift Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="MS"
                {...register('code', { required: 'Shift code is required' })}
                disabled={mode === 'edit'}
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startTime"
                type="time"
                {...register('startTime', { required: 'Start time is required' })}
              />
              {errors.startTime && (
                <p className="text-sm text-red-600">{errors.startTime.message}</p>
              )}
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endTime"
                type="time"
                {...register('endTime', { required: 'End time is required' })}
              />
              {errors.endTime && (
                <p className="text-sm text-red-600">{errors.endTime.message}</p>
              )}
            </div>

            {/* Entry Grace Period */}
            <div className="space-y-2">
              <Label htmlFor="gracePeriod.entry">Entry Grace Period (mins)</Label>
              <Input
                id="gracePeriod.entry"
                type="number"
                placeholder="15"
                {...register('gracePeriod.entry', { valueAsNumber: true })}
              />
            </div>

            {/* Exit Grace Period */}
            <div className="space-y-2">
              <Label htmlFor="gracePeriod.exit">Exit Grace Period (mins)</Label>
              <Input
                id="gracePeriod.exit"
                type="number"
                placeholder="15"
                {...register('gracePeriod.exit', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the shift..."
              rows={2}
              {...register('description')}
            />
          </div>

          {/* Meal Eligibility */}
          <div className="space-y-3">
            <Label>Meal Eligibility</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breakfast"
                  checked={mealEligibility?.breakfast}
                  onCheckedChange={(checked) =>
                    setMealEligibility((prev) => ({
                      ...prev,
                      breakfast: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="breakfast"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Breakfast
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lunch"
                  checked={mealEligibility?.lunch}
                  onCheckedChange={(checked) =>
                    setMealEligibility((prev) => ({
                      ...prev,
                      lunch: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="lunch"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lunch
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dinner"
                  checked={mealEligibility?.dinner}
                  onCheckedChange={(checked) =>
                    setMealEligibility((prev) => ({
                      ...prev,
                      dinner: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="dinner"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Dinner
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snacks"
                  checked={mealEligibility?.snacks}
                  onCheckedChange={(checked) =>
                    setMealEligibility((prev) => ({
                      ...prev,
                      snacks: checked as boolean,
                    }))
                  }
                />
                <label
                  htmlFor="snacks"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Snacks
                </label>
              </div>
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
              {mode === 'create' ? 'Create Shift' : 'Update Shift'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
