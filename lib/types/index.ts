export type UserRole =
  | 'admin'
  | 'hr'
  | 'canteen_manager'
  | 'store_keeper'
  | 'purchase_committee'
  | 'dept_head'
  | 'employee'

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'leave'

export type MealSessionType =
  | 'breakfast'
  | 'mid_morning'
  | 'lunch'
  | 'afternoon'
  | 'dinner'
  | 'night'

export type EligibilityStatus = 'authorized' | 'not_authorized' | 'guest'

export type MovementType = 'receipt' | 'issue' | 'adjustment' | 'return'

export type DemandStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'fulfilled'

export type POStatus = 'draft' | 'approved' | 'partial' | 'completed' | 'cancelled'

export type BillStatus = 'pending' | 'verified' | 'paid' | 'overdue'

export type ReconciliationStatus = 'pending' | 'approved' | 'rejected'

export type NotificationType =
  | 'meal'
  | 'stock'
  | 'approval'
  | 'alert'
  | 'info'

export interface Profile {
  id: string
  email: string
  name: string
  role: UserRole
  department_id: string | null
  employee_code: string | null
  is_vendor: boolean
  phone: string | null
  status: string
}

export interface Department {
  id: string
  name: string
  code: string | null
  status: string
}

export interface MealSession {
  id: string
  name: string
  session_type: MealSessionType
  start_time: string
  end_time: string
  sort_order: number
  status: string
}

export interface Shift {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  status: string
}

export interface Item {
  id: string
  name: string
  code: string
  category_id: string | null
  unit: string
  min_threshold: number
  current_stock: number
  status: string
}

export interface Vendor {
  id: string
  name: string
  code: string
  contact_person: string | null
  email: string | null
  phone: string | null
  status: string
}

export interface DashboardStats {
  todayMeals: number
  lowStockItems: number
  pendingApprovals: number
  monthlySpend: number
}
