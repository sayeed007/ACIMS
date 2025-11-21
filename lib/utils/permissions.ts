/**
 * Centralized permission checking utilities
 * Handles role-based and permission-based access control
 */

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_ADMIN'
  | 'STORE_KEEPER'
  | 'CANTEEN_MANAGER'
  | 'USER';

export interface PermissionCheck {
  user: {
    role: string;
    permissions?: string[];
  } | null;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

/**
 * Admin roles that have elevated privileges
 */
const ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN'];

/**
 * Check if user has admin role (SUPER_ADMIN or ADMIN)
 * SUPER_ADMIN has access to everything
 */
export function isAdmin(userRole: string | undefined): boolean {
  if (!userRole) return false;
  return ADMIN_ROLES.includes(userRole as UserRole);
}

/**
 * Check if user is SUPER_ADMIN
 */
export function isSuperAdmin(userRole: string | undefined): boolean {
  return userRole === 'SUPER_ADMIN';
}

/**
 * Check if user can perform an action based on permission or role
 * SUPER_ADMIN has access to all actions
 */
export function can(
  permission: string,
  allowedRoles: UserRole[],
  check: PermissionCheck
): boolean {
  if (!check.user) return false;

  // SUPER_ADMIN has access to everything
  if (check.user.role === 'SUPER_ADMIN') return true;

  // Check if user has the specific permission
  if (check.hasPermission(permission)) return true;

  // Check if user has one of the allowed roles
  return check.hasRole(allowedRoles);
}

/**
 * Permission checkers for common operations
 */
export const canAccess = {
  // Employee permissions
  employees: {
    view: (check: PermissionCheck) =>
      can('employee:read', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    create: (check: PermissionCheck) =>
      can('employee:create', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    edit: (check: PermissionCheck) =>
      can('employee:update', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    delete: (check: PermissionCheck) =>
      can('employee:delete', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
  },

  // Department permissions
  departments: {
    view: (check: PermissionCheck) =>
      can('department:read', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    create: (check: PermissionCheck) =>
      can('department:create', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    edit: (check: PermissionCheck) =>
      can('department:update', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    delete: (check: PermissionCheck) =>
      can('department:delete', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
  },

  // Shift permissions
  shifts: {
    view: (check: PermissionCheck) =>
      can('shift:read', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    create: (check: PermissionCheck) =>
      can('shift:create', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    edit: (check: PermissionCheck) =>
      can('shift:update', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    delete: (check: PermissionCheck) =>
      can('shift:delete', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
  },

  // Meal session permissions
  mealSessions: {
    view: (check: PermissionCheck) =>
      can('meal-session:read', ['SUPER_ADMIN', 'ADMIN', 'CANTEEN_MANAGER'], check),
    create: (check: PermissionCheck) =>
      can('meal-session:create', ['SUPER_ADMIN', 'ADMIN', 'CANTEEN_MANAGER'], check),
    edit: (check: PermissionCheck) =>
      can('meal-session:update', ['SUPER_ADMIN', 'ADMIN', 'CANTEEN_MANAGER'], check),
    delete: (check: PermissionCheck) =>
      can('meal-session:delete', ['SUPER_ADMIN', 'ADMIN', 'CANTEEN_MANAGER'], check),
  },

  // Inventory permissions
  inventory: {
    view: (check: PermissionCheck) =>
      can('inventory:read', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    create: (check: PermissionCheck) =>
      can('inventory:create', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    edit: (check: PermissionCheck) =>
      can('inventory:update', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    delete: (check: PermissionCheck) =>
      can('inventory:delete', ['SUPER_ADMIN', 'ADMIN'], check),
  },

  // Stock movement permissions
  stockMovements: {
    view: (check: PermissionCheck) =>
      can('inventory:read', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    create: (check: PermissionCheck) =>
      can('inventory:create', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    edit: (check: PermissionCheck) =>
      can('inventory:update', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    delete: (check: PermissionCheck) =>
      can('inventory:delete', ['SUPER_ADMIN', 'ADMIN'], check),
  },

  // Procurement permissions
  procurement: {
    view: (check: PermissionCheck) =>
      can('procurement:read', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    create: (check: PermissionCheck) =>
      can('procurement:create', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    edit: (check: PermissionCheck) =>
      can('procurement:update', ['SUPER_ADMIN', 'ADMIN', 'STORE_KEEPER'], check),
    delete: (check: PermissionCheck) =>
      can('procurement:delete', ['SUPER_ADMIN', 'ADMIN'], check),
  },

  // Eligibility rules permissions
  eligibility: {
    view: (check: PermissionCheck) =>
      can('eligibility:read', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'CANTEEN_MANAGER'], check),
    create: (check: PermissionCheck) =>
      can('eligibility:create', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    edit: (check: PermissionCheck) =>
      can('eligibility:update', ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN'], check),
    delete: (check: PermissionCheck) =>
      can('eligibility:delete', ['SUPER_ADMIN', 'ADMIN'], check),
  },

  // Access control permissions
  accessControl: {
    view: (check: PermissionCheck) =>
      can('access-control:read', ['SUPER_ADMIN'], check),
    create: (check: PermissionCheck) =>
      can('access-control:create', ['SUPER_ADMIN'], check),
    edit: (check: PermissionCheck) =>
      can('access-control:update', ['SUPER_ADMIN'], check),
    delete: (check: PermissionCheck) =>
      can('access-control:delete', ['SUPER_ADMIN'], check),
  },
};
