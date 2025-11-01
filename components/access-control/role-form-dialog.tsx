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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  useCreateAccessControlRole,
  useUpdateAccessControlRole,
  type AccessControlRole,
} from '@/hooks/useAccessControlRoles';
import { Loader2 } from 'lucide-react';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: AccessControlRole | null;
  mode: 'create' | 'edit';
}

interface RoleFormData {
  roleName: string;
  description?: string;
  moduleAccess: {
    dashboard: boolean;
    employees: boolean;
    departments: boolean;
    shifts: boolean;
    mealSessions: boolean;
    mealTransactions: boolean;
    inventory: boolean;
    procurement: boolean;
    reports: boolean;
    settings: boolean;
    eligibility: boolean;
  };
  dataScope: {
    type: 'ALL' | 'DEPARTMENT' | 'OWN';
  };
  isActive: boolean;
}

const modules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'employees', label: 'Employees' },
  { key: 'departments', label: 'Departments' },
  { key: 'shifts', label: 'Shifts' },
  { key: 'mealSessions', label: 'Meal Sessions' },
  { key: 'mealTransactions', label: 'Meal Transactions' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'procurement', label: 'Procurement' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'eligibility', label: 'Eligibility' },
];

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  mode,
}: RoleFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({
    dashboard: true,
    employees: false,
    departments: false,
    shifts: false,
    mealSessions: false,
    mealTransactions: false,
    inventory: false,
    procurement: false,
    reports: false,
    settings: false,
    eligibility: false,
  });
  const [dataScope, setDataScope] = useState<'ALL' | 'DEPARTMENT' | 'OWN'>('OWN');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateAccessControlRole();
  const updateMutation = useUpdateAccessControlRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    defaultValues: {
      roleName: '',
      description: '',
    },
  });

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && role) {
        reset({
          roleName: role.roleName,
          description: role.description || '',
        });
        setModuleAccess(role.moduleAccess || moduleAccess);
        setDataScope((role as any).dataScope?.type || 'OWN');
        setIsActive(role.isActive);
      } else {
        reset({
          roleName: '',
          description: '',
        });
        setModuleAccess({
          dashboard: true,
          employees: false,
          departments: false,
          shifts: false,
          mealSessions: false,
          mealTransactions: false,
          inventory: false,
          procurement: false,
          reports: false,
          settings: false,
          eligibility: false,
        });
        setDataScope('OWN');
        setIsActive(true);
      }
    }
  }, [open, mode, role, reset]);

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      const submitData = {
        ...data,
        moduleAccess,
        dataScope: { type: dataScope },
        isActive,
        permissions: [], // Empty for now, can be extended
      };

      if (mode === 'create') {
        await createMutation.mutateAsync(submitData);
      } else if (role) {
        await updateMutation.mutateAsync({
          id: role._id,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Role' : 'Edit Role'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details to create a new access control role.'
              : 'Update the role information below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Role Name */}
              <div className="space-y-2">
                <Label htmlFor="roleName">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="roleName"
                  placeholder="e.g., Manager, Supervisor"
                  {...register('roleName', { required: 'Role name is required' })}
                />
                {errors.roleName && (
                  <p className="text-sm text-red-600">{errors.roleName.message}</p>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive" className="font-normal">
                    {isActive ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the role and its responsibilities..."
                rows={2}
                {...register('description')}
              />
            </div>
          </div>

          {/* Data Scope */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Data Access Scope</h3>
            <div className="space-y-2">
              <Label htmlFor="dataScope">Scope Type</Label>
              <input
                type="hidden"
                {...register('dataScope.type')}
                value={dataScope}
              />
              <Select value={dataScope} onValueChange={(value: any) => setDataScope(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Data - Can access all records</SelectItem>
                  <SelectItem value="DEPARTMENT">Department - Limited to specific departments</SelectItem>
                  <SelectItem value="OWN">Own - Only own records</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Controls what data users with this role can access
              </p>
            </div>
          </div>

          {/* Module Access */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Module Access</h3>
            <div className="grid grid-cols-2 gap-3">
              {modules.map((module) => (
                <div key={module.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={module.key}
                    checked={moduleAccess[module.key]}
                    onCheckedChange={(checked) =>
                      setModuleAccess((prev) => ({
                        ...prev,
                        [module.key]: checked === true,
                      }))
                    }
                  />
                  <Label
                    htmlFor={module.key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {module.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select which modules users with this role can access in the navigation
            </p>
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
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
