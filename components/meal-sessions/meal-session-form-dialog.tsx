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
  useCreateMealSession,
  useUpdateMealSession,
  type MealSession,
  type CreateMealSessionData,
} from '@/hooks/useMealSessions';
import { Loader2 } from 'lucide-react';

interface MealSessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealSession?: MealSession | null;
  mode: 'create' | 'edit';
}

export function MealSessionFormDialog({
  open,
  onOpenChange,
  mealSession,
  mode,
}: MealSessionFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useCreateMealSession();
  const updateMutation = useUpdateMealSession();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateMealSessionData>({
    defaultValues: {
      name: '',
      code: '',
      mealType: 'LUNCH',
      startTime: '12:00',
      endTime: '13:00',
      description: '',
      maxCapacity: 0,
    },
  });

  const selectedMealType = watch('mealType');

  // Reset form when dialog opens/closes or meal session changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && mealSession) {
        reset({
          name: mealSession.name,
          code: mealSession.code,
          mealType: mealSession.mealType,
          startTime: mealSession.startTime,
          endTime: mealSession.endTime,
          description: mealSession.description || '',
          maxCapacity: mealSession.maxCapacity || 0,
        });
      } else {
        reset({
          name: '',
          code: '',
          mealType: 'LUNCH',
          startTime: '12:00',
          endTime: '13:00',
          description: '',
          maxCapacity: 0,
        });
      }
    }
  }, [open, mode, mealSession, reset]);

  const onSubmit = async (data: CreateMealSessionData) => {
    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(data);
      } else if (mealSession) {
        await updateMutation.mutateAsync({
          id: mealSession._id,
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
            {mode === 'create' ? 'Add New Meal Session' : 'Edit Meal Session'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new meal session.'
              : 'Update the meal session information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Session Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Session Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Lunch - Session 1"
                {...register('name', { required: 'Session name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Session Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Session Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="L1"
                {...register('code', { required: 'Session code is required' })}
                disabled={mode === 'edit'}
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>

            {/* Meal Type */}
            <div className="space-y-2">
              <Label htmlFor="mealType">
                Meal Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedMealType}
                onValueChange={(value: any) => setValue('mealType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                  <SelectItem value="LUNCH">Lunch</SelectItem>
                  <SelectItem value="DINNER">Dinner</SelectItem>
                  <SelectItem value="SNACKS">Snacks</SelectItem>
                  <SelectItem value="OVERTIME_MEAL">Overtime Meal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Max Capacity */}
            <div className="space-y-2">
              <Label htmlFor="maxCapacity">Max Capacity (optional)</Label>
              <Input
                id="maxCapacity"
                type="number"
                placeholder="100"
                {...register('maxCapacity', { valueAsNumber: true })}
              />
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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the meal session..."
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
              {mode === 'create' ? 'Create Session' : 'Update Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
