import { UserRole } from '../types'

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  hr: [
    'employees:read',
    'employees:write',
    'attendance:read',
    'attendance:write',
    'departments:write',
    'shifts:write',
  ],
  canteen_manager: [
    'employees:read',
    'attendance:read',
    'meal_sessions:write',
    'meal_events:read',
    'eligibility:write',
    'guest_meals:approve',
    'inventory:read',
    'reports:read',
  ],
  store_keeper: [
    'inventory:read',
    'inventory:write',
    'stock_movements:write',
    'reconciliation:write',
    'demands:read',
    'vendors:read',
  ],
  purchase_committee: [
    'demands:read',
    'demands:approve',
    'vendors:write',
    'po:write',
    'bills:write',
    'reports:read',
  ],
  dept_head: [
    'employees:read',
    'attendance:read',
    'guest_meals:request',
    'guest_meals:approve',
    'reports:read',
  ],
  employee: ['profile:read', 'profile:write', 'attendance:read', 'meal_events:read'],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = rolePermissions[role]
  return permissions.includes('*') || permissions.includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    hr: 'HR Manager',
    canteen_manager: 'Canteen Manager',
    store_keeper: 'Store Keeper',
    purchase_committee: 'Purchase Committee',
    dept_head: 'Department Head',
    employee: 'Employee',
  }
  return labels[role]
}

export function getRoleBadgeVariant(
  role: UserRole
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    admin: 'destructive',
    hr: 'default',
    canteen_manager: 'default',
    store_keeper: 'secondary',
    purchase_committee: 'default',
    dept_head: 'secondary',
    employee: 'outline',
  }
  return variants[role]
}
