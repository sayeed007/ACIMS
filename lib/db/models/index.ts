/**
 * Central export file for all Mongoose models
 * Import models from here to ensure consistent usage across the application
 */

// Authentication & Users
export { default as User } from './User';
export { default as Session } from './Session';

// Employee Management
export { default as Department } from './Department';
export { default as Shift } from './Shift';
export { default as Employee } from './Employee';
export { default as EmployeeAttendance } from './EmployeeAttendance';

// Meal Management
export { default as MealSession } from './MealSession';
export { default as MealTransaction } from './MealTransaction';

// Inventory Management
export { default as InventoryItem } from './InventoryItem';

// Procurement & Financial
export { default as Vendor } from './Vendor';

// Notifications & System
export { default as Notification } from './Notification';
export { default as AuditLog } from './AuditLog';
export { default as Device } from './Device';

// Type exports
export type { IUser } from './User';
export type { ISession } from './Session';
export type { IDepartment } from './Department';
export type { IShift } from './Shift';
export type { IEmployee } from './Employee';
export type { IEmployeeAttendance } from './EmployeeAttendance';
export type { IMealSession } from './MealSession';
export type { IMealTransaction } from './MealTransaction';
export type { IInventoryItem } from './InventoryItem';
export type { IVendor } from './Vendor';
export type { INotification } from './Notification';
export type { IAuditLog } from './AuditLog';
export type { IDevice } from './Device';
