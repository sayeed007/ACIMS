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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateEligibilityRule,
  useUpdateEligibilityRule,
  type EligibilityRule,
} from '@/hooks/useEligibilityRules';
import { useMealSessions } from '@/hooks/useMealSessions';
import { useShifts } from '@/hooks/useShifts';
import { useDepartments } from '@/hooks/useDepartments';
import { useEmployees } from '@/hooks/useEmployees';
import { Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface EligibilityRuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: EligibilityRule | null;
  mode: 'create' | 'edit';
}

interface FormData {
  ruleName: string;
  description?: string;
  mealSessionId: string;
  priority: number;
  requiresAttendance: boolean;
  requiresOT: boolean;
  isActive: boolean;
}

export function EligibilityRuleFormDialog({
  open,
  onOpenChange,
  rule,
  mode,
}: EligibilityRuleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployeeTypes, setSelectedEmployeeTypes] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  const createMutation = useCreateEligibilityRule();
  const updateMutation = useUpdateEligibilityRule();

  const { data: mealSessionsData } = useMealSessions({ limit: 100 });
  const { data: shiftsData } = useShifts({ limit: 100 });
  const { data: departmentsData } = useDepartments({ limit: 100 });
  const { data: employeesData } = useEmployees({ limit: 100 });

  const mealSessions = mealSessionsData?.data || [];
  const shifts = shiftsData?.data || [];
  const departments = departmentsData?.data || [];
  const employees = employeesData?.data || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      ruleName: '',
      description: '',
      mealSessionId: '',
      priority: 1,
      requiresAttendance: true,
      requiresOT: false,
      isActive: true,
    },
  });

  // Register mealSessionId manually for validation
  useEffect(() => {
    register('mealSessionId', { required: 'Meal session is required' });
  }, [register]);

  const mealSessionId = watch('mealSessionId');

  // Reset form when dialog opens/closes or rule changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && rule) {
        reset({
          ruleName: rule.ruleName,
          description: rule.description || '',
          mealSessionId: rule.mealSession?.id || '',
          priority: rule.priority,
          requiresAttendance: rule.requiresAttendance,
          requiresOT: rule.requiresOT || false,
          isActive: rule.isActive,
        });
        setSelectedShifts(rule.applicableFor?.shifts || []);
        setSelectedDepartments(rule.applicableFor?.departments || []);
        setSelectedEmployeeTypes(rule.applicableFor?.employeeTypes || []);
        setSelectedEmployees(rule.applicableFor?.specificEmployees || []);
      } else {
        reset({
          ruleName: '',
          description: '',
          mealSessionId: '',
          priority: 1,
          requiresAttendance: true,
          requiresOT: false,
          isActive: true,
        });
        setSelectedShifts([]);
        setSelectedDepartments([]);
        setSelectedEmployeeTypes([]);
        setSelectedEmployees([]);
      }
    }
  }, [open, mode, rule, reset]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Find the selected meal session to get its name
      const selectedMealSession = mealSessions.find((s: any) => s._id === data.mealSessionId);

      if (!selectedMealSession) {
        toast.error('Please select a valid meal session');
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        ruleName: data.ruleName,
        description: data.description,
        mealSession: {
          id: data.mealSessionId,
          name: selectedMealSession.name,
        },
        applicableFor: {
          shifts: selectedShifts.length > 0 ? selectedShifts : undefined,
          departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
          employeeTypes: selectedEmployeeTypes.length > 0 ? selectedEmployeeTypes as any : undefined,
          specificEmployees: selectedEmployees.length > 0 ? selectedEmployees : undefined,
        },
        requiresAttendance: data.requiresAttendance,
        requiresOT: data.requiresOT,
        priority: data.priority,
        isActive: data.isActive,
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
      } else if (rule) {
        await updateMutation.mutateAsync({
          id: rule._id,
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

  const toggleShift = (shiftId: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shiftId) ? prev.filter((id) => id !== shiftId) : [...prev, shiftId]
    );
  };

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleEmployeeType = (type: string) => {
    setSelectedEmployeeTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Eligibility Rule' : 'Edit Eligibility Rule'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Define a new rule to control meal access eligibility.'
              : 'Update the eligibility rule information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Rule Name */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="ruleName">
                Rule Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ruleName"
                placeholder="e.g., Morning Shift Breakfast Access"
                {...register('ruleName', { required: 'Rule name is required' })}
              />
              {errors.ruleName && (
                <p className="text-sm text-red-600">{errors.ruleName.message}</p>
              )}
            </div>

            {/* Meal Session */}
            <div className="space-y-2">
              <Label htmlFor="mealSessionId">
                Meal Session <span className="text-red-500">*</span>
              </Label>
              <Select
                value={mealSessionId}
                onValueChange={(value) => setValue('mealSessionId', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal session" />
                </SelectTrigger>
                <SelectContent>
                  {mealSessions.map((session: any) => (
                    <SelectItem key={session._id} value={session._id}>
                      {session.name} ({session.mealType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!mealSessionId && errors.mealSessionId && (
                <p className="text-sm text-red-600">Meal session is required</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority <span className="text-red-500">*</span>
              </Label>
              <Input
                id="priority"
                type="number"
                min="1"
                placeholder="1"
                {...register('priority', {
                  required: 'Priority is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Priority must be at least 1' }
                })}
              />
              {errors.priority && (
                <p className="text-sm text-red-600">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this eligibility rule..."
              rows={2}
              {...register('description')}
            />
          </div>

          {/* Applicable For - Shifts */}
          <div className="space-y-2">
            <Label>Applicable Shifts (Optional)</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {shifts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shifts available</p>
              ) : (
                shifts.map((shift: any) => (
                  <div key={shift._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`shift-${shift._id}`}
                      checked={selectedShifts.includes(shift._id)}
                      onCheckedChange={() => toggleShift(shift._id)}
                    />
                    <label
                      htmlFor={`shift-${shift._id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {shift.name} ({shift.code})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Applicable For - Departments */}
          <div className="space-y-2">
            <Label>Applicable Departments (Optional)</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {departments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No departments available</p>
              ) : (
                departments.map((dept: any) => (
                  <div key={dept._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dept-${dept._id}`}
                      checked={selectedDepartments.includes(dept._id)}
                      onCheckedChange={() => toggleDepartment(dept._id)}
                    />
                    <label
                      htmlFor={`dept-${dept._id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {dept.name} ({dept.code})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Applicable For - Employee Types */}
          <div className="space-y-2">
            <Label>Applicable Employee Types (Optional)</Label>
            <div className="border rounded-md p-3 space-y-2">
              {['PERMANENT', 'CONTRACT', 'VENDOR'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedEmployeeTypes.includes(type)}
                    onCheckedChange={() => toggleEmployeeType(type)}
                  />
                  <label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Applicable For - Specific Employees */}
          <div className="space-y-2">
            <Label>Specific Employees (Optional)</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
              {employees.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employees available</p>
              ) : (
                employees.map((emp: any) => (
                  <div key={emp._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`emp-${emp._id}`}
                      checked={selectedEmployees.includes(emp._id)}
                      onCheckedChange={() => toggleEmployee(emp._id)}
                    />
                    <label
                      htmlFor={`emp-${emp._id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {emp.name} ({emp.employeeId})
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-3 border rounded-md p-4">
            <Label>Requirements</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresAttendance"
                  checked={watch('requiresAttendance')}
                  onCheckedChange={(checked) =>
                    setValue('requiresAttendance', checked as boolean)
                  }
                />
                <label
                  htmlFor="requiresAttendance"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Requires Attendance
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresOT"
                  checked={watch('requiresOT')}
                  onCheckedChange={(checked) =>
                    setValue('requiresOT', checked as boolean)
                  }
                />
                <label
                  htmlFor="requiresOT"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Requires Overtime (OT)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={watch('isActive')}
                  onCheckedChange={(checked) =>
                    setValue('isActive', checked as boolean)
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Active Rule
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
              {mode === 'create' ? 'Create Rule' : 'Update Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
